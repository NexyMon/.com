from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import Task, ActivityCategory, Activity, UserPreference, Friendship # Friendship Modell importieren

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True, label="Confirm password")
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'password2', 'email', 'first_name', 'last_name')
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        # E-Mail Einzigartigkeit prüfen (obwohl das Model dies auch tut, eine frühe Validierung ist gut)
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({"email": "Email already exists."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

# Die folgende Zeile wurde entfernt, da der Import jetzt oben steht.
# from .models import Task # Task-Modell importieren - HIER STAND ES FALSCH, verschoben nach oben

class TaskSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username') # Zeigt den Benutzernamen an, anstatt der ID. Ist ReadOnly.
                                                           # Der User wird in der View beim Erstellen gesetzt.
    # Wenn man die User-ID sehen will und sie beim Erstellen nicht mitschicken muss (wird in View gesetzt):
    # user = serializers.PrimaryKeyRelatedField(read_only=True)


    class Meta:
        model = Task
        fields = ['id', 'user', 'title', 'description', 'priority', 'due_date', 'status', 'created_at', 'updated_at']
        # 'user' wird jetzt durch ReadOnlyField abgedeckt und muss nicht mehr in read_only_fields
        read_only_fields = ('created_at', 'updated_at')

    # Die validate_user Methode ist hier nicht ideal, da der User in der View gesetzt wird (perform_create).
    # Die Berechtigung, ob ein User einen Task für sich selbst erstellt, wird durch das queryset in der View sichergestellt.

class ActivityCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityCategory
        fields = ['id', 'name', 'description']

class ActivitySerializer(serializers.ModelSerializer):
    category = serializers.StringRelatedField() # Zeigt den Namen der Kategorie statt der ID
    # Wenn man die Kategorie-ID beim Erstellen/Aktualisieren übergeben will:
    # category = serializers.PrimaryKeyRelatedField(queryset=ActivityCategory.objects.all(), allow_null=True)

    class Meta:
        model = Activity
        fields = [
            'id', 'category', 'name', 'description', 'is_outdoor',
            'min_duration_minutes', 'max_duration_minutes', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ('created_at', 'updated_at')

class UserPreferenceSerializer(serializers.ModelSerializer):
    user = serializers.ReadOnlyField(source='user.username')
    # preferred_categories = ActivityCategorySerializer(many=True, read_only=True) # Zeigt komplette Kategorie-Objekte
    # Wenn man IDs zum Aktualisieren der preferred_categories senden will:
    preferred_categories = serializers.PrimaryKeyRelatedField(
        queryset=ActivityCategory.objects.all(),
        many=True,
        allow_empty=True
    )

    class Meta:
        model = UserPreference
        fields = ['id', 'user', 'preferred_categories', 'created_at', 'updated_at']
        read_only_fields = ('user', 'created_at', 'updated_at')

    def update(self, instance, validated_data):
        # Spezielle Behandlung für ManyToMany-Felder beim Update
        preferred_categories_data = validated_data.pop('preferred_categories', None)
        instance = super().update(instance, validated_data)
        if preferred_categories_data is not None:
            instance.preferred_categories.set(preferred_categories_data)
        return instance

class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing users - for search/adding friends.
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name'] # Nur nicht-sensitive Infos

class FriendshipSerializer(serializers.ModelSerializer):
    from_user = UserListSerializer(read_only=True)
    to_user = UserListSerializer(read_only=True) # Beim Erstellen wird die ID übergeben
    to_user_id = serializers.IntegerField(write_only=True) # Für das Senden der Anfrage

    class Meta:
        model = Friendship
        fields = ['id', 'from_user', 'to_user', 'to_user_id', 'status', 'created_at', 'updated_at']
        read_only_fields = ['from_user', 'status', 'created_at', 'updated_at'] # Status wird durch Aktionen geändert

    def validate_to_user_id(self, value):
        """
        Check that the to_user exists and is not the same as the requesting user.
        """
        request_user = self.context['request'].user
        if not User.objects.filter(id=value).exists():
            raise serializers.ValidationError("User does not exist.")
        if request_user.id == value:
            raise serializers.ValidationError("You cannot send a friend request to yourself.")
        # Prüfen, ob bereits eine Anfrage existiert (in beide Richtungen)
        if Friendship.objects.filter(
            from_user=request_user, to_user_id=value
        ).exists() or Friendship.objects.filter(
            from_user_id=value, to_user=request_user
        ).exists():
            raise serializers.ValidationError("A friend request already exists or you are already friends.")
        return value

    def create(self, validated_data):
        from_user = self.context['request'].user
        to_user_id = validated_data.pop('to_user_id')
        to_user = User.objects.get(id=to_user_id)

        # Erstelle die Freundschaftsanfrage
        friendship = Friendship.objects.create(from_user=from_user, to_user=to_user, **validated_data)
        return friendship
