from datetime import timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from api.models import Client, Project, Payment
from api.chatbot import (
    get_dashboard_summary,
    get_overdue_payments,
    get_upcoming_payments,
    get_client_details,
    get_payment_summary,
    process_chat_message
)

class ClientPaymentSystemTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='adminpassword123'
        )
        self.client = APIClient()
        login_res = self.client.post('/api/auth/login/', {
            'username': 'admin',
            'password': 'adminpassword123'
        })
        self.assertEqual(login_res.status_code, 200)
        self.token = login_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token}')

    def test_create_client_with_full_payment(self):
        today = timezone.now().date()
        payload = {
            'name': 'Test Client Full',
            'company_name': 'Full Pay Ltd',
            'email': 'full@example.com',
            'phone': '1234567890',
            'address': 'Test Address',
            'project_name': 'Full Pay Project',
            'project_start_date': str(today),
            'total_amount': '10000.00',
            'payment_type': 'FULL',
            'installment_count': 1,
            'first_payment_due_date': str(today),
            'payment_interval': 'monthly'
        }
        res = self.client.post('/api/clients/', payload, format='json')
        self.assertEqual(res.status_code, 201)
        client_id = res.data['id']

        client_obj = Client.objects.get(id=client_id)
        self.assertEqual(client_obj.projects.count(), 1)
        project = client_obj.projects.first()
        self.assertEqual(project.total_amount, Decimal('10000.00'))
        self.assertEqual(project.payments.count(), 1)

        payment = project.payments.first()
        self.assertEqual(payment.amount, Decimal('10000.00'))
        self.assertEqual(payment.effective_status, 'PENDING')

    def test_create_client_with_installments_rounding(self):
        today = timezone.now().date()
        payload = {
            'name': 'Installment Client',
            'company_name': 'Installment Inc',
            'email': 'inst@example.com',
            'phone': '9876543210',
            'address': 'Installment Address',
            'project_name': '3-Part Project',
            'project_start_date': str(today),
            'total_amount': '10000.00',
            'payment_type': 'INSTALLMENTS',
            'installment_count': 3,
            'first_payment_due_date': str(today),
            'payment_interval': 'monthly'
        }
        res = self.client.post('/api/clients/', payload, format='json')
        self.assertEqual(res.status_code, 201)

        client_obj = Client.objects.get(id=res.data['id'])
        project = client_obj.projects.first()
        payments = list(project.payments.all())
        self.assertEqual(len(payments), 3)

        total_scheduled = sum(p.amount for p in payments)
        self.assertEqual(total_scheduled, Decimal('10000.00'))
        self.assertEqual(payments[0].amount, Decimal('3333.33'))
        self.assertEqual(payments[1].amount, Decimal('3333.33'))
        self.assertEqual(payments[2].amount, Decimal('3333.34'))

    def test_mark_payment_as_paid_and_overdue_logic(self):
        today = timezone.now().date()
        client = Client.objects.create(name='Acme', email='acme@test.com', phone='111')
        project = Project.objects.create(
            client=client,
            project_name='CRM',
            total_amount=Decimal('5000.00'),
            start_date=today - timedelta(days=20)
        )
        payment = Payment.objects.create(
            project=project,
            amount=Decimal('5000.00'),
            due_date=today - timedelta(days=10),
            status='PENDING'
        )
        self.assertEqual(payment.effective_status, 'OVERDUE')

        mark_res = self.client.post(f'/api/payments/{payment.id}/mark-paid/', {
            'paid_date': str(today),
            'transaction_reference': 'TXN-999'
        })
        self.assertEqual(mark_res.status_code, 200)
        payment.refresh_from_db()
        self.assertEqual(payment.status, 'PAID')
        self.assertEqual(payment.effective_status, 'PAID')
        self.assertEqual(payment.transaction_reference, 'TXN-999')

    def test_dashboard_summary_api(self):
        res = self.client.get('/api/dashboard/summary/')
        self.assertEqual(res.status_code, 200)
        self.assertIn('metrics', res.data)
        self.assertIn('total_clients', res.data['metrics'])
        self.assertIn('total_projects', res.data['metrics'])
        self.assertIn('total_amount_received', res.data['metrics'])
        self.assertIn('status_overview', res.data)

    def test_chatbot_data_functions(self):
        summary = get_dashboard_summary()
        self.assertIn('total_clients', summary)

        overdue = get_overdue_payments()
        self.assertIsInstance(overdue, list)

        upcoming = get_upcoming_payments(days=30)
        self.assertIsInstance(upcoming, list)

        details = get_client_details('Nonexistent Client')
        self.assertFalse(details['found'])

        reply = process_chat_message('What is our total received amount?')
        self.assertIsInstance(reply, str)
        self.assertTrue(len(reply) > 0)
