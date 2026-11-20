from datetime import timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import Client, Project, Payment
from api.chatbot import (
    get_dashboard_summary,
    get_overdue_payments,
    get_upcoming_payments,
    get_client_details,
    get_payment_summary,
    process_chat_message
)

class SecurityAndAuthTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.superuser = User.objects.create_superuser(
            username='sec_admin',
            email='sec_admin@example.com',
            password='ComplexAdminPassword@2026'
        )
        self.staff_user = User.objects.create_user(
            username='sec_staff',
            email='staff@example.com',
            password='StaffPassword@2026',
            is_staff=True,
            is_superuser=False
        )
        self.normal_user = User.objects.create_user(
            username='sec_normal',
            email='normal@example.com',
            password='NormalPassword@2026',
            is_staff=False,
            is_superuser=False
        )
        self.client = APIClient()

    def test_1_superuser_login_success(self):
        res = self.client.post('/api/auth/login/', {
            'username': 'sec_admin',
            'password': 'ComplexAdminPassword@2026'
        })
        self.assertEqual(res.status_code, 200)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertTrue(res.data['user']['is_superuser'])

    def test_2_incorrect_password_rejected(self):
        res = self.client.post('/api/auth/login/', {
            'username': 'sec_admin',
            'password': 'WrongPassword123!'
        })
        self.assertEqual(res.status_code, 401)

    def test_3_normal_user_login_denied(self):
        res = self.client.post('/api/auth/login/', {
            'username': 'sec_normal',
            'password': 'NormalPassword@2026'
        })
        self.assertEqual(res.status_code, 401)
        self.assertNotIn('access', res.data)

    def test_4_staff_user_login_denied(self):
        res = self.client.post('/api/auth/login/', {
            'username': 'sec_staff',
            'password': 'StaffPassword@2026'
        })
        self.assertEqual(res.status_code, 401)
        self.assertNotIn('access', res.data)

    def test_5_unauthenticated_api_request_401(self):
        client = APIClient()
        endpoints = [
            '/api/auth/user/',
            '/api/dashboard/summary/',
            '/api/clients/',
            '/api/projects/',
            '/api/payments/',
        ]
        for ep in endpoints:
            res = client.get(ep)
            self.assertEqual(res.status_code, 401, f"Expected 401 for unauthenticated {ep}")

    def test_6_non_superuser_api_request_403(self):
        normal_refresh = RefreshToken.for_user(self.normal_user)
        normal_token = str(normal_refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {normal_token}')

        endpoints = [
            '/api/auth/user/',
            '/api/dashboard/summary/',
            '/api/clients/',
            '/api/projects/',
            '/api/payments/',
        ]
        for ep in endpoints:
            res = self.client.get(ep)
            self.assertEqual(res.status_code, 403, f"Expected 403 for non-superuser {ep}")

    def test_7_revoked_superuser_token_denied_403(self):
        login_res = self.client.post('/api/auth/login/', {
            'username': 'sec_admin',
            'password': 'ComplexAdminPassword@2026'
        })
        token = login_res.data['access']
        refresh = login_res.data['refresh']

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        res = self.client.get('/api/dashboard/summary/')
        self.assertEqual(res.status_code, 200)

        self.superuser.is_superuser = False
        self.superuser.save()

        res_after_revocation = self.client.get('/api/dashboard/summary/')
        self.assertEqual(res_after_revocation.status_code, 403)

        refresh_res = self.client.post('/api/auth/refresh/', {'refresh': refresh})
        self.assertEqual(refresh_res.status_code, 401)

    def test_8_superuser_authorized_endpoints(self):
        login_res = self.client.post('/api/auth/login/', {
            'username': 'sec_admin',
            'password': 'ComplexAdminPassword@2026'
        })
        token = login_res.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')

        res_user = self.client.get('/api/auth/user/')
        self.assertEqual(res_user.status_code, 200)
        self.assertTrue(res_user.data['is_superuser'])

        res_dash = self.client.get('/api/dashboard/summary/')
        self.assertEqual(res_dash.status_code, 200)

        res_clients = self.client.get('/api/clients/')
        self.assertEqual(res_clients.status_code, 200)

        res_projects = self.client.get('/api/projects/')
        self.assertEqual(res_projects.status_code, 200)

        res_payments = self.client.get('/api/payments/')
        self.assertEqual(res_payments.status_code, 200)

        res_chat = self.client.post('/api/chat/', {'message': 'Hello'}, format='json')
        self.assertEqual(res_chat.status_code, 200)

class BusinessLogicTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_superuser(
            username='test_admin',
            email='test_admin@example.com',
            password='TestAdminPassword@2026'
        )
        self.client = APIClient()
        login_res = self.client.post('/api/auth/login/', {
            'username': 'test_admin',
            'password': 'TestAdminPassword@2026'
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
