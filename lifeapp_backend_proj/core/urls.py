from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserCreateView,
    HelloWorldView,
    TaskViewSet,
    ActivityCategoryViewSet,
    ActivityViewSet,
    UserPreferenceView,
    UserListViewSet, # UserListViewSet importieren
    FriendshipViewSet # FriendshipViewSet importieren
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'activity-categories', ActivityCategoryViewSet, basename='activitycategory')
router.register(r'activities', ActivityViewSet, basename='activity')
router.register(r'users', UserListViewSet, basename='userlist') # Für Usersuche
router.register(r'friendships', FriendshipViewSet, basename='friendship') # Für Freundschaften

urlpatterns = [
    # Auth URLs
    path('register/', UserCreateView.as_view(), name='user_register'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # User Preferences URL
    path('preferences/', UserPreferenceView.as_view(), name='user_preferences'),

    # Test Endpunkt
    path('hello/', HelloWorldView.as_view(), name='hello_world'),

    # Router URLs für Tasks, Activities, etc.
    path('', include(router.urls)),
]
