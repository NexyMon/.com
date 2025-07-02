from django.contrib.auth.models import User
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .serializers import UserSerializer

class UserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny] # Jeder darf sich registrieren

# Wir können die eingebauten Views für Token Erhalt und Refresh nutzen,
# aber wenn wir sie anpassen wollen, können wir sie hier überschreiben.
# Fürs Erste reichen die Standard-Views, die wir in urls.py einbinden.

from rest_framework import viewsets # viewsets importieren
from .models import Task # Task Modell importieren
from .serializers import TaskSerializer # TaskSerializer importieren

# Beispiel für eine geschützte View, die einen Token erfordert:
class HelloWorldView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response({"message": f"Hello {request.user.username}, you are authenticated!"})

class TaskViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows tasks to be viewed or edited.
    """
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated] # Nur authentifizierte Benutzer

    def get_queryset(self):
        """
        This view should return a list of all the tasks
        for the currently authenticated user.
        """
        return Task.objects.filter(user=self.request.user).order_by('priority', 'due_date', 'created_at')

    def perform_create(self, serializer):
        """
        Associate the task with the logged-in user when creating a new task.
        """
        serializer.save(user=self.request.user)

from .models import ActivityCategory, Activity, UserPreference
from django.contrib.auth.models import User # User importieren
from .serializers import ActivityCategorySerializer, ActivitySerializer, UserPreferenceSerializer

class ActivityCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows activity categories to be viewed.
    """
    queryset = ActivityCategory.objects.all()
    serializer_class = ActivityCategorySerializer
    permission_classes = [permissions.IsAuthenticated] # Oder AllowAny, wenn Kategorien öffentlich sein sollen

class ActivityViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint that allows activities to be viewed.
    Allows filtering by category_id.
    Example: /api/activities/?category_id=1
    """
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated] # Oder AllowAny

    def get_queryset(self):
        queryset = Activity.objects.all()
        category_id = self.request.query_params.get('category_id')
        if category_id is not None:
            queryset = queryset.filter(category_id=category_id)
        return queryset

class UserPreferenceView(generics.RetrieveUpdateAPIView):
    """
    API endpoint that allows the logged-in user's preferences to be viewed or edited.
    """
    serializer_class = UserPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        # Stellt sicher, dass UserPreference für den aktuellen Benutzer erstellt wird, falls nicht vorhanden.
        obj, created = UserPreference.objects.get_or_create(user=self.request.user)
        return obj

    # perform_update wird vom Serializer (update Methode) gehandhabt, wenn ManyToMany Felder dabei sind.
    # Wenn wir hier den User setzen müssten (was bei OneToOneField nicht der Fall ist, da es beim get_object erstellt wird),
    # wäre es hier:
from django.db.models import Q # Für komplexe Abfragen (OR)
from rest_framework.decorators import action # Für custom actions in ViewSets
from rest_framework.response import Response
from rest_framework import status

    # def perform_update(self, serializer):
    #     serializer.save(user=self.request.user)

from .models import Friendship
from .serializers import FriendshipSerializer, UserListSerializer


class UserListViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint for listing and searching users.
    Allows searching by username. Example: /api/users/?search=john
    """
    serializer_class = UserListSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = User.objects.all().exclude(id=self.request.user.id) # Schließe den eigenen User aus
        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(username__icontains=search_query)
        return queryset.order_by('username')


class FriendshipViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing friendships.
    - POST to /api/friendships/ to send a friend request (pass 'to_user_id').
    - GET to /api/friendships/ to list sent and received pending/accepted requests.
    - DELETE to /api/friendships/{id}/ to cancel a sent request or remove a friend.
    - Custom actions: accept_request, decline_request.
    """
    serializer_class = FriendshipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        # Zeige alle Freundschaften, bei denen der User entweder Sender oder Empfänger ist
        # und die nicht abgelehnt wurden (oder man könnte abgelehnte auch anzeigen, je nach Anforderung)
        return Friendship.objects.filter(
            Q(from_user=user) | Q(to_user=user)
        ).exclude(status=Friendship.STATUS_DECLINED).select_related('from_user', 'to_user')

    def perform_create(self, serializer):
        # from_user wird im Serializer aus dem Request-Kontext gesetzt
        serializer.save() # from_user wird im Serializer.create gesetzt

    # Action zum Annehmen einer Freundschaftsanfrage
    @action(detail=True, methods=['post'], url_path='accept')
    def accept_request(self, request, pk=None):
        try:
            friendship_request = Friendship.objects.get(id=pk, to_user=request.user, status=Friendship.STATUS_PENDING)
        except Friendship.DoesNotExist:
            return Response({'detail': 'Pending request not found or you are not the recipient.'}, status=status.HTTP_404_NOT_FOUND)

        friendship_request.status = Friendship.STATUS_ACCEPTED
        friendship_request.save()

        # Optional: Erstelle eine gespiegelte Freundschaft für einfachere Abfragen von "Freunden"
        # Friendship.objects.get_or_create(
        #     from_user=friendship_request.to_user,
        #     to_user=friendship_request.from_user,
        #     defaults={'status': Friendship.STATUS_ACCEPTED}
        # )
        # Für dieses Beispiel belassen wir es bei der einseitigen Akzeptanz.
        # Die Abfrage von Freunden muss dann beide Richtungen berücksichtigen.

        return Response({'status': 'request accepted'}, status=status.HTTP_200_OK)

    # Action zum Ablehnen einer Freundschaftsanfrage
    @action(detail=True, methods=['post'], url_path='decline')
    def decline_request(self, request, pk=None):
        try:
            friendship_request = Friendship.objects.get(id=pk, to_user=request.user, status=Friendship.STATUS_PENDING)
        except Friendship.DoesNotExist:
            return Response({'detail': 'Pending request not found or you are not the recipient.'}, status=status.HTTP_404_NOT_FOUND)

        friendship_request.status = Friendship.STATUS_DECLINED
        # Alternativ: friendship_request.delete() # Wenn abgelehnte Anfragen nicht gespeichert werden sollen
        friendship_request.save()
        return Response({'status': 'request declined'}, status=status.HTTP_200_OK)

    # Die Standard-destroy Methode (DELETE /api/friendships/{id}/) kann verwendet werden, um:
    # 1. Eine gesendete 'pending' Anfrage zurückzuziehen (wenn man from_user ist).
    # 2. Eine bestehende Freundschaft ('accepted') zu beenden (egal ob from_user oder to_user).
    def perform_destroy(self, instance):
        user = self.request.user
        # Nur der Sender einer 'pending' Anfrage oder einer der beiden bei 'accepted' darf löschen.
        if instance.status == Friendship.STATUS_PENDING and instance.from_user == user:
            instance.delete()
        elif instance.status == Friendship.STATUS_ACCEPTED and (instance.from_user == user or instance.to_user == user):
            # Hier könnte man entscheiden, ob man den Eintrag löscht oder auf 'declined'/'blocked' setzt.
            # Fürs Erste löschen wir die Verbindung.
            instance.delete()
            # Optional: Auch die gespiegelte Verbindung löschen, falls vorhanden.
        else:
            # Verhindere das Löschen durch nicht autorisierte User oder in unerwünschten Status
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You do not have permission to delete this friendship record in its current state.")
