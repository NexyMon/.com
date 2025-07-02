from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from .models import Task # Import Task if you are testing Task related APIs here

# Tipp: Es ist oft besser, Test-Daten (User, Tasks etc.) in setUp-Methoden zu erstellen.

class AuthAPITests(APITestCase):
    def setUp(self):
        self.register_url = reverse('user_register')
        self.login_url = reverse('token_obtain_pair')
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'StrongPassword123',
            'password2': 'StrongPassword123'
        }
        self.user_login_data = {
            'username': 'testuser',
            'password': 'StrongPassword123'
        }

    def test_user_registration_success(self):
        """
        Ensure a new user can be created successfully.
        """
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().username, 'testuser')

    def test_user_registration_passwords_mismatch(self):
        """
        Ensure user registration fails if passwords do not match.
        """
        data = self.user_data.copy()
        data['password2'] = 'WrongPassword123'
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data) # Check if 'password' key is in error response

    def test_user_registration_duplicate_username(self):
        """
        Ensure user registration fails if username already exists.
        """
        self.client.post(self.register_url, self.user_data, format='json') # First user
        response = self.client.post(self.register_url, self.user_data, format='json') # Attempt duplicate
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)

    def test_user_registration_duplicate_email(self):
        """
        Ensure user registration fails if email already exists.
        """
        self.client.post(self.register_url, self.user_data, format='json') # First user
        data = self.user_data.copy()
        data['username'] = 'anotheruser' # Different username, same email
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_user_login_success(self):
        """
        Ensure a registered user can log in and receive tokens.
        """
        self.client.post(self.register_url, self.user_data, format='json') # Register user first
        response = self.client.post(self.login_url, self.user_login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_user_login_invalid_credentials(self):
        """
        Ensure login fails with invalid credentials.
        """
        self.client.post(self.register_url, self.user_data, format='json')
        response = self.client.post(self.login_url, {'username': 'testuser', 'password': 'WrongPassword'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_login_nonexistent_user(self):
        """
        Ensure login fails if the user does not exist.
        """
        response = self.client.post(self.login_url, {'username': 'nonexistent', 'password': 'somepassword'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TaskAPITests(APITestCase):
    def setUp(self):
        # URLs
        self.tasks_url = reverse('task-list') # 'task-list' ist der Standardname von DRF für die Listen/Erstell-View eines ViewSets

        # User 1
        self.user1_data = {'username': 'user1', 'password': 'Password1', 'email': 'user1@example.com'}
        self.user1 = User.objects.create_user(**self.user1_data)

        # User 2
        self.user2_data = {'username': 'user2', 'password': 'Password2', 'email': 'user2@example.com'}
        self.user2 = User.objects.create_user(**self.user2_data)

        # Task data
        self.task_data_user1 = {'title': 'User1 Task 1', 'description': 'Description for U1T1', 'priority': 1}

        # Authenticate User 1 by default for most tests
        self.client.force_authenticate(user=self.user1)

    def test_create_task_authenticated(self):
        """
        Ensure an authenticated user can create a task.
        """
        response = self.client.post(self.tasks_url, self.task_data_user1, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Task.objects.count(), 1)
        self.assertEqual(Task.objects.get().title, 'User1 Task 1')
        self.assertEqual(Task.objects.get().user, self.user1)

    def test_create_task_unauthenticated(self):
        """
        Ensure an unauthenticated user cannot create a task.
        """
        self.client.logout() # oder self.client.force_authenticate(user=None)
        response = self.client.post(self.tasks_url, self.task_data_user1, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_own_tasks(self):
        """
        Ensure a user can list their own tasks.
        """
        Task.objects.create(user=self.user1, title='U1 Task for list', priority=2)
        Task.objects.create(user=self.user1, title='U1 Task 2 for list', priority=1)
        Task.objects.create(user=self.user2, title='U2 Task (should not be listed)', priority=1) # Task for another user

        response = self.client.get(self.tasks_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2) # Should only see 2 tasks for user1
        self.assertTrue(any(task['title'] == 'U1 Task for list' for task in response.data))
        self.assertFalse(any(task['title'] == 'U2 Task (should not be listed)' for task in response.data))

    def test_retrieve_own_task(self):
        """
        Ensure a user can retrieve their own task by ID.
        """
        task = Task.objects.create(user=self.user1, title='Retrieve Me', priority=1)
        detail_url = reverse('task-detail', kwargs={'pk': task.pk}) # 'task-detail' für Detailansicht
        response = self.client.get(detail_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Retrieve Me')

    def test_cannot_retrieve_others_task(self):
        """
        Ensure a user cannot retrieve another user's task.
        """
        task_user2 = Task.objects.create(user=self.user2, title='User2 Private Task', priority=1)
        detail_url = reverse('task-detail', kwargs={'pk': task_user2.pk})
        response = self.client.get(detail_url, format='json') # user1 is authenticated
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND) # Because queryset filters by user

    def test_update_own_task(self):
        """
        Ensure a user can update their own task.
        """
        task = Task.objects.create(user=self.user1, title='Update Me', priority=3)
        detail_url = reverse('task-detail', kwargs={'pk': task.pk})
        updated_data = {'title': 'Updated Title', 'priority': 1, 'status': 'done'}
        response = self.client.put(detail_url, updated_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.title, 'Updated Title')
        self.assertEqual(task.priority, 1)
        self.assertEqual(task.status, 'done')

    def test_cannot_update_others_task(self):
        """
        Ensure a user cannot update another user's task.
        """
        task_user2 = Task.objects.create(user=self.user2, title='User2 Original Task', priority=2)
        detail_url = reverse('task-detail', kwargs={'pk': task_user2.pk})
        updated_data = {'title': 'Attempted Update by User1', 'priority': 1}
        response = self.client.put(detail_url, updated_data, format='json') # user1 is authenticated
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND) # Or 403 if permissions were different
        task_user2.refresh_from_db()
        self.assertEqual(task_user2.title, 'User2 Original Task') # Ensure it wasn't changed

    def test_delete_own_task(self):
        """
        Ensure a user can delete their own task.
        """
        task = Task.objects.create(user=self.user1, title='Delete Me', priority=1)
        self.assertEqual(Task.objects.count(), 1)
        detail_url = reverse('task-detail', kwargs={'pk': task.pk})
        response = self.client.delete(detail_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Task.objects.count(), 0)

    def test_cannot_delete_others_task(self):
        """
        Ensure a user cannot delete another user's task.
        """
        task_user2 = Task.objects.create(user=self.user2, title='User2 Stable Task', priority=1)
        self.assertEqual(Task.objects.count(), 1)
        detail_url = reverse('task-detail', kwargs={'pk': task_user2.pk})
        response = self.client.delete(detail_url, format='json') # user1 is authenticated
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND) # Or 403
        self.assertEqual(Task.objects.count(), 1) # Task should still exist
