from django.db import models
from django.utils import timezone

class Client(models.Model):
    name = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255, blank=True, default='')
    email = models.EmailField()
    phone = models.CharField(max_length=50)
    address = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.name

class Project(models.Model):
    PAYMENT_TYPE_CHOICES = (
        ('FULL', 'Full Payment'),
        ('INSTALLMENTS', 'Installments'),
    )

    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='projects')
    project_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPE_CHOICES, default='FULL')
    installment_count = models.PositiveIntegerField(default=1)
    start_date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.project_name} ({self.client.name})"

class Payment(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('PAID', 'Paid'),
        ('OVERDUE', 'Overdue'),
    )

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    transaction_reference = models.CharField(max_length=100, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_date', 'id']

    def __str__(self):
        return f"{self.project.project_name} - {self.amount} ({self.status})"

    def save(self, *args, **kwargs):
        if self.paid_date is not None or self.status == 'PAID':
            self.status = 'PAID'
            if self.paid_date is None:
                self.paid_date = timezone.now().date()
        elif self.due_date and self.due_date < timezone.now().date():
            self.status = 'OVERDUE'
        else:
            self.status = 'PENDING'
        super().save(*args, **kwargs)

    @property
    def effective_status(self):
        if self.paid_date is not None or self.status == 'PAID':
            return 'PAID'
        if self.due_date and self.due_date < timezone.now().date():
            return 'OVERDUE'
        return 'PENDING'
