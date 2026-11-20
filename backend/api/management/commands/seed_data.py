from datetime import timedelta
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from api.models import Client, Project, Payment

class Command(BaseCommand):
    help = 'Seeds sample client, project, and payment records if database is empty'

    def handle(self, *args, **options):
        if Client.objects.exists():
            self.stdout.write("Database already contains clients. Skipping sample client data.")
            return

        today = timezone.now().date()

        client1 = Client.objects.create(
            name='Rajesh Sharma',
            company_name='Acme Global Corp',
            email='rajesh@acmeglobal.com',
            phone='+91 98200 12345',
            address='Level 5, Cyber Gateway, Hitec City, Hyderabad'
        )
        p1 = Project.objects.create(
            client=client1,
            project_name='Enterprise Cloud Migration',
            description='Full architecture migration to AWS cloud with Docker and Kubernetes',
            total_amount=Decimal('120000.00'),
            payment_type='INSTALLMENTS',
            installment_count=3,
            start_date=today - timedelta(days=45)
        )
        Payment.objects.create(
            project=p1,
            amount=Decimal('40000.00'),
            due_date=today - timedelta(days=40),
            paid_date=today - timedelta(days=38),
            status='PAID',
            transaction_reference='TXN-ACM-001'
        )
        Payment.objects.create(
            project=p1,
            amount=Decimal('40000.00'),
            due_date=today + timedelta(days=10),
            status='PENDING'
        )
        Payment.objects.create(
            project=p1,
            amount=Decimal('40000.00'),
            due_date=today + timedelta(days=40),
            status='PENDING'
        )

        client2 = Client.objects.create(
            name='Sunita Verma',
            company_name='ABC Traders',
            email='sunita@abctraders.in',
            phone='+91 98450 67890',
            address='42 Commercial Street, Bangalore'
        )
        p2 = Project.objects.create(
            client=client2,
            project_name='B2B E-Commerce Marketplace',
            description='Multi-vendor wholesale portal with payment gateway integration',
            total_amount=Decimal('45000.00'),
            payment_type='FULL',
            installment_count=1,
            start_date=today - timedelta(days=20)
        )
        Payment.objects.create(
            project=p2,
            amount=Decimal('45000.00'),
            due_date=today - timedelta(days=15),
            paid_date=today - timedelta(days=14),
            status='PAID',
            transaction_reference='TXN-ABC-992'
        )

        client3 = Client.objects.create(
            name='Vikram Mehta',
            company_name='Apex Logistics',
            email='vikram@apexlogistics.com',
            phone='+91 98111 22334',
            address='Plot 12, Transport Nagar, New Delhi'
        )
        p3 = Project.objects.create(
            client=client3,
            project_name='Fleet Telematics Dashboard',
            description='Real-time GPS vehicle tracking and fuel monitoring SaaS',
            total_amount=Decimal('75000.00'),
            payment_type='INSTALLMENTS',
            installment_count=3,
            start_date=today - timedelta(days=60)
        )
        Payment.objects.create(
            project=p3,
            amount=Decimal('25000.00'),
            due_date=today - timedelta(days=50),
            paid_date=today - timedelta(days=49),
            status='PAID',
            transaction_reference='TXN-APX-301'
        )
        Payment.objects.create(
            project=p3,
            amount=Decimal('25000.00'),
            due_date=today - timedelta(days=10),
            status='OVERDUE'
        )
        Payment.objects.create(
            project=p3,
            amount=Decimal('25000.00'),
            due_date=today + timedelta(days=20),
            status='PENDING'
        )

        client4 = Client.objects.create(
            name='Ananya Sen',
            company_name='Zen Fitness Studio',
            email='ananya@zenfitness.com',
            phone='+91 97333 44556',
            address='8B Park Street, Kolkata'
        )
        p4 = Project.objects.create(
            client=client4,
            project_name='Member Booking & CRM App',
            description='Mobile-first class scheduling and membership management system',
            total_amount=Decimal('30000.00'),
            payment_type='FULL',
            installment_count=1,
            start_date=today - timedelta(days=35)
        )
        Payment.objects.create(
            project=p4,
            amount=Decimal('30000.00'),
            due_date=today - timedelta(days=5),
            status='OVERDUE'
        )

        client5 = Client.objects.create(
            name='David Paul',
            company_name='Horizon Design Works',
            email='david@horizondesign.io',
            phone='+91 99888 77665',
            address='Indiranagar 100ft Road, Bangalore'
        )
        p5 = Project.objects.create(
            client=client5,
            project_name='Corporate Brand Identity & Web System',
            description='Complete brand redesign, design system, and responsive web app',
            total_amount=Decimal('60000.00'),
            payment_type='INSTALLMENTS',
            installment_count=4,
            start_date=today - timedelta(days=30)
        )
        Payment.objects.create(
            project=p5,
            amount=Decimal('15000.00'),
            due_date=today - timedelta(days=25),
            paid_date=today - timedelta(days=24),
            status='PAID',
            transaction_reference='TXN-HRZ-101'
        )
        Payment.objects.create(
            project=p5,
            amount=Decimal('15000.00'),
            due_date=today - timedelta(days=5),
            paid_date=today - timedelta(days=3),
            status='PAID',
            transaction_reference='TXN-HRZ-102'
        )
        Payment.objects.create(
            project=p5,
            amount=Decimal('15000.00'),
            due_date=today + timedelta(days=15),
            status='PENDING'
        )
        Payment.objects.create(
            project=p5,
            amount=Decimal('15000.00'),
            due_date=today + timedelta(days=45),
            status='PENDING'
        )

        self.stdout.write(self.style.SUCCESS("Successfully seeded sample clients, projects, and payments."))
