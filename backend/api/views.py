from decimal import Decimal
from datetime import timedelta
from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework import status, permissions, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .models import Client, Project, Payment
from .permissions import IsSuperuser
from .serializers import (
    ClientSerializer,
    ProjectSerializer,
    PaymentSerializer,
    MarkPaidSerializer,
    SuperuserTokenObtainPairSerializer,
    SuperuserTokenRefreshSerializer,
)
from .chatbot import (
    sync_payment_statuses,
    get_dashboard_summary,
    process_chat_message,
)

class SuperuserTokenObtainPairView(TokenObtainPairView):
    serializer_class = SuperuserTokenObtainPairSerializer

class SuperuserTokenRefreshView(TokenRefreshView):
    serializer_class = SuperuserTokenRefreshSerializer

class CurrentUserView(APIView):
    permission_classes = [IsSuperuser]

    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'is_staff': user.is_staff,
            'is_superuser': user.is_superuser,
        })

class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all().prefetch_related('projects', 'projects__payments')
    serializer_class = ClientSerializer
    permission_classes = [IsSuperuser]

    def get_queryset(self):
        sync_payment_statuses()
        qs = Client.objects.all().prefetch_related('projects', 'projects__payments')
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(company_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )

        status_filter = self.request.query_params.get('status', '').strip().lower()
        if status_filter in ('paid', 'pending', 'overdue'):
            today = timezone.now().date()
            if status_filter == 'overdue':
                qs = qs.filter(projects__payments__paid_date__isnull=True, projects__payments__due_date__lt=today).distinct()
            elif status_filter == 'paid':
                qs = qs.exclude(projects__payments__paid_date__isnull=True).filter(projects__payments__isnull=False).distinct()
            elif status_filter == 'pending':
                qs = qs.filter(projects__payments__paid_date__isnull=True, projects__payments__due_date__gte=today).distinct()

        return qs

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all().select_related('client').prefetch_related('payments')
    serializer_class = ProjectSerializer
    permission_classes = [IsSuperuser]

    def get_queryset(self):
        sync_payment_statuses()
        qs = Project.objects.all().select_related('client').prefetch_related('payments')
        client_id = self.request.query_params.get('client_id')
        if client_id:
            qs = qs.filter(client_id=client_id)
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(project_name__icontains=search) |
                Q(client__name__icontains=search) |
                Q(client__company_name__icontains=search)
            )
        return qs

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all().select_related('project', 'project__client')
    serializer_class = PaymentSerializer
    permission_classes = [IsSuperuser]

    def get_queryset(self):
        sync_payment_statuses()
        qs = Payment.objects.all().select_related('project', 'project__client')
        
        status_param = self.request.query_params.get('status', '').strip().upper()
        if status_param in ('PAID', 'PENDING', 'OVERDUE'):
            qs = qs.filter(status=status_param)

        project_id = self.request.query_params.get('project_id')
        if project_id:
            qs = qs.filter(project_id=project_id)

        client_id = self.request.query_params.get('client_id')
        if client_id:
            qs = qs.filter(project__client_id=client_id)

        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(project__project_name__icontains=search) |
                Q(project__client__name__icontains=search) |
                Q(project__client__company_name__icontains=search) |
                Q(transaction_reference__icontains=search)
            )

        return qs

    @action(detail=True, methods=['post'], url_path='mark-paid')
    def mark_paid(self, request, pk=None):
        payment = self.get_object()
        serializer = MarkPaidSerializer(data=request.data)
        if serializer.is_valid():
            paid_date = serializer.validated_data.get('paid_date') or timezone.now().date()
            tx_ref = serializer.validated_data.get('transaction_reference', '').strip()
            
            payment.paid_date = paid_date
            payment.status = 'PAID'
            if tx_ref:
                payment.transaction_reference = tx_ref
            payment.save()

            return Response(PaymentSerializer(payment).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        sync_payment_statuses()
        today = timezone.now().date()
        limit = int(request.query_params.get('limit', 10))
        days = int(request.query_params.get('days', 30))
        end_date = today + timedelta(days=days)

        payments = Payment.objects.filter(
            paid_date__isnull=True,
            due_date__gte=today,
            due_date__lte=end_date
        ).select_related('project', 'project__client').order_by('due_date')[:limit]

        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        sync_payment_statuses()
        today = timezone.now().date()
        limit = int(request.query_params.get('limit', 10))

        payments = Payment.objects.filter(
            paid_date__isnull=True,
            due_date__lt=today
        ).select_related('project', 'project__client').order_by('due_date')[:limit]

        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)

class DashboardSummaryView(APIView):
    permission_classes = [IsSuperuser]

    def get(self, request):
        sync_payment_statuses()
        today = timezone.now().date()
        summary = get_dashboard_summary()

        upcoming = Payment.objects.filter(
            paid_date__isnull=True,
            due_date__gte=today
        ).select_related('project', 'project__client').order_by('due_date')[:5]

        overdue = Payment.objects.filter(
            paid_date__isnull=True,
            due_date__lt=today
        ).select_related('project', 'project__client').order_by('due_date')[:5]

        recent = Payment.objects.filter(
            paid_date__isnull=False
        ).select_related('project', 'project__client').order_by('-paid_date', '-updated_at')[:5]

        paid_amount = Decimal(summary['total_amount_received'])
        pending_amount = Decimal(summary['total_pending_amount'])
        overdue_amount = Decimal(summary['total_overdue_amount'])
        total_tracked = paid_amount + pending_amount

        paid_count = Payment.objects.filter(paid_date__isnull=False).count()
        pending_count = Payment.objects.filter(paid_date__isnull=True, due_date__gte=today).count()
        overdue_count = summary['overdue_payments_count']

        status_overview = {
            'paid': {
                'count': paid_count,
                'amount': str(paid_amount),
                'percentage': round((paid_amount / total_tracked * 100), 1) if total_tracked > 0 else 0,
            },
            'pending': {
                'count': pending_count,
                'amount': str(pending_amount - overdue_amount if pending_amount >= overdue_amount else pending_amount),
                'percentage': round(((pending_amount - overdue_amount) / total_tracked * 100), 1) if total_tracked > 0 else 0,
            },
            'overdue': {
                'count': overdue_count,
                'amount': str(overdue_amount),
                'percentage': round((overdue_amount / total_tracked * 100), 1) if total_tracked > 0 else 0,
            },
        }

        return Response({
            'metrics': summary,
            'upcoming_payments': PaymentSerializer(upcoming, many=True).data,
            'overdue_payments': PaymentSerializer(overdue, many=True).data,
            'recent_payments': PaymentSerializer(recent, many=True).data,
            'status_overview': status_overview,
        })

class ChatbotView(APIView):
    permission_classes = [IsSuperuser]

    def post(self, request):
        message = request.data.get('message', '').strip()
        history = request.data.get('history', [])
        if not message:
            return Response({'error': 'Message is required.'}, status=status.HTTP_400_BAD_REQUEST)

        reply = process_chat_message(message, history=history)
        return Response({'reply': reply})
