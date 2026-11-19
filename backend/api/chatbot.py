import json
from decimal import Decimal
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from django.db.models import Sum, Q
from .models import Client, Project, Payment

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return str(obj)
    raise TypeError

def sync_payment_statuses():
    today = timezone.now().date()
    Payment.objects.filter(paid_date__isnull=True, status='PENDING', due_date__lt=today).update(status='OVERDUE')
    Payment.objects.filter(paid_date__isnull=False).exclude(status='PAID').update(status='PAID')

def get_dashboard_summary():
    sync_payment_statuses()
    today = timezone.now().date()
    
    total_clients = Client.objects.count()
    total_projects = Project.objects.count()
    
    total_val_agg = Project.objects.aggregate(total=Sum('total_amount'))
    total_project_value = str(total_val_agg['total'] or Decimal('0.00'))
    
    received_agg = Payment.objects.filter(paid_date__isnull=False).aggregate(total=Sum('amount'))
    total_received = str(received_agg['total'] or Decimal('0.00'))
    
    pending_agg = Payment.objects.filter(paid_date__isnull=True).aggregate(total=Sum('amount'))
    total_pending = str(pending_agg['total'] or Decimal('0.00'))
    
    overdue_count = Payment.objects.filter(paid_date__isnull=True, due_date__lt=today).count()
    overdue_agg = Payment.objects.filter(paid_date__isnull=True, due_date__lt=today).aggregate(total=Sum('amount'))
    total_overdue = str(overdue_agg['total'] or Decimal('0.00'))
    
    installment_clients_count = Client.objects.filter(projects__payment_type='INSTALLMENTS').distinct().count()
    
    return {
        'total_clients': total_clients,
        'total_projects': total_projects,
        'total_project_value': total_project_value,
        'total_amount_received': total_received,
        'total_pending_amount': total_pending,
        'overdue_payments_count': overdue_count,
        'total_overdue_amount': total_overdue,
        'installment_clients_count': installment_clients_count,
    }

def get_overdue_payments():
    sync_payment_statuses()
    today = timezone.now().date()
    payments = Payment.objects.filter(
        paid_date__isnull=True,
        due_date__lt=today
    ).select_related('project', 'project__client').order_by('due_date')
    
    results = []
    for p in payments:
        results.append({
            'payment_id': p.id,
            'client_name': p.project.client.name,
            'company_name': p.project.client.company_name,
            'project_name': p.project.project_name,
            'amount': str(p.amount),
            'due_date': str(p.due_date),
            'days_overdue': (today - p.due_date).days,
            'status': 'Overdue',
        })
    return results

def get_upcoming_payments(days=30):
    sync_payment_statuses()
    today = timezone.now().date()
    end_date = today + timedelta(days=days)
    payments = Payment.objects.filter(
        paid_date__isnull=True,
        due_date__gte=today,
        due_date__lte=end_date
    ).select_related('project', 'project__client').order_by('due_date')
    
    results = []
    for p in payments:
        results.append({
            'payment_id': p.id,
            'client_name': p.project.client.name,
            'company_name': p.project.client.company_name,
            'project_name': p.project.project_name,
            'amount': str(p.amount),
            'due_date': str(p.due_date),
            'days_until_due': (p.due_date - today).days,
            'status': 'Pending',
        })
    return results

def get_client_details(query):
    clients = Client.objects.filter(
        Q(name__icontains=query) | Q(company_name__icontains=query) | Q(email__icontains=query)
    ).prefetch_related('projects', 'projects__payments')
    
    if not clients.exists():
        if str(query).isdigit():
            clients = Client.objects.filter(id=int(query)).prefetch_related('projects', 'projects__payments')
            
    if not clients.exists():
        return {'found': False, 'message': f"No client found matching '{query}'."}
        
    results = []
    for c in clients:
        projects_data = []
        client_total = Decimal('0.00')
        client_paid = Decimal('0.00')
        
        for prj in c.projects.all():
            client_total += prj.total_amount
            prj_paid = Decimal('0.00')
            pmts = []
            for p in prj.payments.all():
                if p.effective_status == 'PAID':
                    prj_paid += p.amount
                    client_paid += p.amount
                pmts.append({
                    'id': p.id,
                    'amount': str(p.amount),
                    'due_date': str(p.due_date),
                    'paid_date': str(p.paid_date) if p.paid_date else None,
                    'status': p.effective_status,
                })
            projects_data.append({
                'project_name': prj.project_name,
                'total_amount': str(prj.total_amount),
                'payment_type': prj.payment_type,
                'installment_count': prj.installment_count,
                'paid_amount': str(prj_paid),
                'remaining_amount': str(max(Decimal('0.00'), prj.total_amount - prj_paid)),
                'payments': pmts,
            })
            
        results.append({
            'id': c.id,
            'name': c.name,
            'company_name': c.company_name,
            'email': c.email,
            'phone': c.phone,
            'address': c.address,
            'total_project_value': str(client_total),
            'total_paid': str(client_paid),
            'remaining_balance': str(max(Decimal('0.00'), client_total - client_paid)),
            'projects': projects_data,
        })
    return {'found': True, 'clients': results}

def get_client_payment_history(query):
    client_res = get_client_details(query)
    if not client_res.get('found'):
        return client_res
    return client_res

def get_payment_summary():
    sync_payment_statuses()
    today = timezone.now().date()
    
    paid_count = Payment.objects.filter(paid_date__isnull=False).count()
    paid_sum = Payment.objects.filter(paid_date__isnull=False).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
    
    pending_count = Payment.objects.filter(paid_date__isnull=True, due_date__gte=today).count()
    pending_sum = Payment.objects.filter(paid_date__isnull=True, due_date__gte=today).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
    
    overdue_count = Payment.objects.filter(paid_date__isnull=True, due_date__lt=today).count()
    overdue_sum = Payment.objects.filter(paid_date__isnull=True, due_date__lt=today).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
    
    return {
        'paid': {'count': paid_count, 'total_amount': str(paid_sum)},
        'pending': {'count': pending_count, 'total_amount': str(pending_sum)},
        'overdue': {'count': overdue_count, 'total_amount': str(overdue_sum)},
    }

TOOLS_REGISTRY = {
    'get_dashboard_summary': get_dashboard_summary,
    'get_overdue_payments': get_overdue_payments,
    'get_upcoming_payments': get_upcoming_payments,
    'get_client_details': get_client_details,
    'get_client_payment_history': get_client_payment_history,
    'get_payment_summary': get_payment_summary,
}

OPENAI_TOOLS = [
    {
        'type': 'function',
        'function': {
            'name': 'get_dashboard_summary',
            'description': 'Retrieve overall business metrics including total clients, total projects, total project value, total received amount, total pending amount, overdue payments count, and installment client count.',
            'parameters': {'type': 'object', 'properties': {}, 'required': []},
        },
    },
    {
        'type': 'function',
        'function': {
            'name': 'get_overdue_payments',
            'description': 'Retrieve list of all overdue payments with client name, project name, amount, due date, and days overdue.',
            'parameters': {'type': 'object', 'properties': {}, 'required': []},
        },
    },
    {
        'type': 'function',
        'function': {
            'name': 'get_upcoming_payments',
            'description': 'Retrieve upcoming payments due within the next N days (default 30 days).',
            'parameters': {
                'type': 'object',
                'properties': {
                    'days': {
                        'type': 'integer',
                        'description': 'Number of days ahead to look for upcoming payments (e.g. 7 or 30).',
                    }
                },
                'required': [],
            },
        },
    },
    {
        'type': 'function',
        'function': {
            'name': 'get_client_details',
            'description': 'Retrieve details for a specific client by name, company name, or ID, including contact info, projects, total amounts, paid amount, and remaining balance.',
            'parameters': {
                'type': 'object',
                'properties': {
                    'query': {
                        'type': 'string',
                        'description': 'Client name, company name, or client ID.',
                    }
                },
                'required': ['query'],
            },
        },
    },
    {
        'type': 'function',
        'function': {
            'name': 'get_client_payment_history',
            'description': 'Retrieve payment history and schedule breakdown for a client.',
            'parameters': {
                'type': 'object',
                'properties': {
                    'query': {
                        'type': 'string',
                        'description': 'Client name, company name, or ID.',
                    }
                },
                'required': ['query'],
            },
        },
    },
    {
        'type': 'function',
        'function': {
            'name': 'get_payment_summary',
            'description': 'Retrieve aggregate payment summary grouped by status (Paid, Pending, Overdue).',
            'parameters': {'type': 'object', 'properties': {}, 'required': []},
        },
    },
]

def process_chat_message(user_message, history=None):
    api_key = getattr(settings, 'OPENAI_API_KEY', '').strip()
    if not api_key:
        summary = get_dashboard_summary()
        fallback_msg = (
            "OpenAI API key is not configured in backend environment variables (OPENAI_API_KEY). "
            "To enable intelligent chat reasoning, set OPENAI_API_KEY in backend/.env.\n\n"
            "Live Business Data Summary:\n"
            f"- Total Clients: {summary['total_clients']}\n"
            f"- Total Projects: {summary['total_projects']}\n"
            f"- Total Project Value: ₹{summary['total_project_value']}\n"
            f"- Total Received: ₹{summary['total_amount_received']}\n"
            f"- Total Pending: ₹{summary['total_pending_amount']}\n"
            f"- Overdue Payments: {summary['overdue_payments_count']}"
        )
        return fallback_msg

    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        model = getattr(settings, 'OPENAI_MODEL', 'gpt-4o-mini')

        system_instruction = (
            "You are an AI assistant for a Client & Payment Management System. "
            "You have access to real-time tools to fetch client details, payments, upcoming due dates, "
            "overdue accounts, and dashboard metrics. "
            "Always use the provided read-only tools to retrieve actual data before answering questions. "
            "Never invent or hallucinate client names, dates, or financial amounts. "
            "If data is not found, clearly state that. "
            "Be concise, professional, and clear. Format numbers with currency symbols (e.g. ₹) where applicable."
        )

        messages = [{'role': 'system', 'content': system_instruction}]

        if history and isinstance(history, list):
            for h in history[-8:]:
                if isinstance(h, dict) and h.get('role') in ('user', 'assistant') and h.get('content'):
                    messages.append({'role': h['role'], 'content': str(h['content'])})

        messages.append({'role': 'user', 'content': user_message})

        response = client.chat.completions.create(
            model=model,
            messages=messages,
            tools=OPENAI_TOOLS,
            tool_choice='auto',
            max_tokens=600,
        )

        msg = response.choices[0].message

        if msg.tool_calls:
            messages.append(msg)
            for tool_call in msg.tool_calls:
                func_name = tool_call.function.name
                args_str = tool_call.function.arguments or '{}'
                try:
                    args = json.loads(args_str)
                except Exception:
                    args = {}

                tool_func = TOOLS_REGISTRY.get(func_name)
                if tool_func:
                    try:
                        tool_result = tool_func(**args)
                    except TypeError:
                        tool_result = tool_func()
                    except Exception as e:
                        tool_result = {'error': str(e)}
                else:
                    tool_result = {'error': f'Function {func_name} not found'}

                messages.append({
                    'role': 'tool',
                    'tool_call_id': tool_call.id,
                    'content': json.dumps(tool_result, default=decimal_default),
                })

            second_response = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=600,
            )
            return second_response.choices[0].message.content

        return msg.content or "I checked the database but have no additional notes."

    except Exception as exc:
        return f"Could not process AI request: {str(exc)}"
