from datetime import date
from decimal import Decimal
import calendar
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Client, Project, Payment

class SuperuserTokenObtainPairSerializer(TokenObtainPairSerializer):
    default_error_messages = {
        'no_active_account': 'Invalid credentials or unauthorized access.'
    }

    def validate(self, attrs):
        username = attrs.get(self.username_field, '')
        if username:
            username = username.strip()
            User = get_user_model()
            if '@' in username:
                matched_user = User.objects.filter(email__iexact=username).first()
                if matched_user:
                    attrs[self.username_field] = matched_user.username
            else:
                matched_user = User.objects.filter(username__iexact=username).first()
                if matched_user:
                    attrs[self.username_field] = matched_user.username

        data = super().validate(attrs)
        if not self.user or not self.user.is_active or not self.user.is_superuser:
            raise AuthenticationFailed('Invalid credentials or unauthorized access.')
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'is_superuser': self.user.is_superuser,
        }
        return data

class SuperuserTokenRefreshSerializer(TokenRefreshSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        refresh = RefreshToken(attrs['refresh'])
        user_id = refresh.payload.get('user_id')
        User = get_user_model()
        user = User.objects.filter(id=user_id, is_active=True, is_superuser=True).first()
        if not user:
            raise AuthenticationFailed('Invalid token or unauthorized access.')
        return data

def add_months(source_date, months):
    month = source_date.month - 1 + months
    year = source_date.year + month // 12
    month = month % 12 + 1
    day = min(source_date.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)

class PaymentSerializer(serializers.ModelSerializer):
    client_id = serializers.IntegerField(source='project.client.id', read_only=True)
    client_name = serializers.CharField(source='project.client.name', read_only=True)
    company_name = serializers.CharField(source='project.client.company_name', read_only=True)
    project_name = serializers.CharField(source='project.project_name', read_only=True)
    effective_status = serializers.CharField(read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id',
            'project',
            'project_name',
            'client_id',
            'client_name',
            'company_name',
            'amount',
            'due_date',
            'paid_date',
            'status',
            'effective_status',
            'transaction_reference',
            'created_at',
            'updated_at',
        ]

class MarkPaidSerializer(serializers.Serializer):
    paid_date = serializers.DateField(required=False, default=timezone.now().date)
    transaction_reference = serializers.CharField(required=False, allow_blank=True, default='')

class ProjectSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    company_name = serializers.CharField(source='client.company_name', read_only=True)
    payments = PaymentSerializer(many=True, read_only=True)
    paid_amount = serializers.SerializerMethodField()
    remaining_amount = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()

    first_payment_due_date = serializers.DateField(write_only=True, required=False)
    payment_interval = serializers.CharField(write_only=True, required=False, default='monthly')

    class Meta:
        model = Project
        fields = [
            'id',
            'client',
            'client_name',
            'company_name',
            'project_name',
            'description',
            'total_amount',
            'payment_type',
            'installment_count',
            'start_date',
            'created_at',
            'updated_at',
            'payments',
            'paid_amount',
            'remaining_amount',
            'status',
            'first_payment_due_date',
            'payment_interval',
        ]

    def get_paid_amount(self, obj):
        paid = sum((p.amount for p in obj.payments.all() if p.effective_status == 'PAID'), Decimal('0.00'))
        return str(paid)

    def get_remaining_amount(self, obj):
        total = obj.total_amount
        paid = sum((p.amount for p in obj.payments.all() if p.effective_status == 'PAID'), Decimal('0.00'))
        remaining = max(Decimal('0.00'), total - paid)
        return str(remaining)

    def get_status(self, obj):
        payments = list(obj.payments.all())
        if not payments:
            return 'Pending'
        if any(p.effective_status == 'OVERDUE' for p in payments):
            return 'Overdue'
        if all(p.effective_status == 'PAID' for p in payments):
            return 'Paid'
        return 'Pending'

    def create(self, validated_data):
        first_due_date = validated_data.pop('first_payment_due_date', None)
        payment_interval = validated_data.pop('payment_interval', 'monthly')

        with transaction.atomic():
            project = Project.objects.create(**validated_data)
            due_date = first_due_date or project.start_date
            total_amount = project.total_amount
            payment_type = project.payment_type
            installment_count = max(1, project.installment_count)

            if payment_type == 'FULL':
                Payment.objects.create(
                    project=project,
                    amount=total_amount,
                    due_date=due_date,
                    status='PENDING'
                )
            else:
                base_amount = (total_amount / Decimal(installment_count)).quantize(Decimal('0.01'))
                accumulated = Decimal('0.00')

                for index in range(installment_count):
                    current_due_date = add_months(due_date, index) if payment_interval == 'monthly' else due_date

                    if index == installment_count - 1:
                        current_amount = total_amount - accumulated
                    else:
                        current_amount = base_amount
                        accumulated += current_amount

                    Payment.objects.create(
                        project=project,
                        amount=current_amount,
                        due_date=current_due_date,
                        status='PENDING'
                    )

            return project

class ClientSerializer(serializers.ModelSerializer):
    projects = ProjectSerializer(many=True, read_only=True)
    projects_count = serializers.SerializerMethodField()
    total_project_amount = serializers.SerializerMethodField()
    paid_amount = serializers.SerializerMethodField()
    remaining_balance = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()

    project_name = serializers.CharField(write_only=True, required=False)
    project_description = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    project_start_date = serializers.DateField(write_only=True, required=False)
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, write_only=True, required=False)
    payment_type = serializers.ChoiceField(choices=['FULL', 'INSTALLMENTS'], write_only=True, required=False, default='FULL')
    installment_count = serializers.IntegerField(write_only=True, required=False, default=1)
    first_payment_due_date = serializers.DateField(write_only=True, required=False)
    payment_interval = serializers.CharField(write_only=True, required=False, default='monthly')

    class Meta:
        model = Client
        fields = [
            'id',
            'name',
            'company_name',
            'email',
            'phone',
            'address',
            'created_at',
            'updated_at',
            'projects',
            'projects_count',
            'total_project_amount',
            'paid_amount',
            'remaining_balance',
            'payment_status',
            'project_name',
            'project_description',
            'project_start_date',
            'total_amount',
            'payment_type',
            'installment_count',
            'first_payment_due_date',
            'payment_interval',
        ]

    def get_projects_count(self, obj):
        return obj.projects.count()

    def get_total_project_amount(self, obj):
        total = sum((p.total_amount for p in obj.projects.all()), Decimal('0.00'))
        return str(total)

    def get_paid_amount(self, obj):
        paid = Decimal('0.00')
        for project in obj.projects.all():
            for payment in project.payments.all():
                if payment.effective_status == 'PAID':
                    paid += payment.amount
        return str(paid)

    def get_remaining_balance(self, obj):
        total = sum((p.total_amount for p in obj.projects.all()), Decimal('0.00'))
        paid = Decimal(self.get_paid_amount(obj))
        return str(max(Decimal('0.00'), total - paid))

    def get_payment_status(self, obj):
        all_payments = []
        for project in obj.projects.all():
            all_payments.extend(project.payments.all())
        if not all_payments:
            return 'Pending'
        if any(p.effective_status == 'OVERDUE' for p in all_payments):
            return 'Overdue'
        if all(p.effective_status == 'PAID' for p in all_payments):
            return 'Paid'
        return 'Pending'

    def create(self, validated_data):
        project_name = validated_data.pop('project_name', None)
        project_description = validated_data.pop('project_description', '')
        project_start_date = validated_data.pop('project_start_date', None)
        total_amount = validated_data.pop('total_amount', None)
        payment_type = validated_data.pop('payment_type', 'FULL')
        installment_count = validated_data.pop('installment_count', 1)
        first_payment_due_date = validated_data.pop('first_payment_due_date', None)
        payment_interval = validated_data.pop('payment_interval', 'monthly')

        with transaction.atomic():
            client = Client.objects.create(**validated_data)

            if project_name and total_amount:
                start_date = project_start_date or timezone.now().date()
                project = Project.objects.create(
                    client=client,
                    project_name=project_name,
                    description=project_description,
                    total_amount=total_amount,
                    payment_type=payment_type,
                    installment_count=max(1, int(installment_count)),
                    start_date=start_date
                )

                due_date = first_payment_due_date or start_date
                count = max(1, int(installment_count))

                if payment_type == 'FULL':
                    Payment.objects.create(
                        project=project,
                        amount=total_amount,
                        due_date=due_date,
                        status='PENDING'
                    )
                else:
                    base_amount = (total_amount / Decimal(count)).quantize(Decimal('0.01'))
                    accumulated = Decimal('0.00')

                    for index in range(count):
                        current_due_date = add_months(due_date, index) if payment_interval == 'monthly' else due_date

                        if index == count - 1:
                            current_amount = total_amount - accumulated
                        else:
                            current_amount = base_amount
                            accumulated += current_amount

                        Payment.objects.create(
                            project=project,
                            amount=current_amount,
                            due_date=current_due_date,
                            status='PENDING'
                        )

            return client
