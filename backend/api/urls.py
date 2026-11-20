from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SuperuserTokenObtainPairView,
    SuperuserTokenRefreshView,
    CurrentUserView,
    ClientViewSet,
    ProjectViewSet,
    PaymentViewSet,
    DashboardSummaryView,
    ChatbotView,
)

router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    path('auth/login/', SuperuserTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', SuperuserTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/user/', CurrentUserView.as_view(), name='current_user'),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard_summary'),
    path('chat/', ChatbotView.as_view(), name='chatbot'),
    path('', include(router.urls)),
]
