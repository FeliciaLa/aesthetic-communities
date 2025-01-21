from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Community, GalleryImage, ResourceCategory, Resource, ForumPost, ForumComment

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']
        # Note: We exclude password field for security

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password']

    def create(self, validated_data):
        """
        Create a new user with the provided validated data.
        """
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class CommunitySerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source='created_by.username')
    
    class Meta:
        model = Community
        fields = ['id', 'name', 'description', 'created_by', 'created_at']

class GalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryImage
        fields = ['id', 'image', 'uploaded_by', 'uploaded_at', 'community']
        read_only_fields = ['uploaded_by', 'uploaded_at']

class ResourceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceCategory
        fields = ['id', 'name', 'category_type', 'description', 'community', 'created_by']
        read_only_fields = ['created_by']

    def validate(self, data):
        print("Validation data:", data)
        return data

    def create(self, validated_data):
        print("Creating with data:", validated_data)
        return super().create(validated_data)

class ResourceSerializer(serializers.ModelSerializer):
    created_by = serializers.ReadOnlyField(source='created_by.username')
    
    class Meta:
        model = Resource
        fields = ['id', 'title', 'description', 'url', 'author', 'category', 'created_by', 'created_at']

class ForumCommentSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = ForumComment
        fields = ['id', 'content', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['created_by', 'created_at', 'updated_at']

class ForumPostSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    comments = ForumCommentSerializer(many=True, read_only=True)
    community = serializers.PrimaryKeyRelatedField(read_only=True)
    
    class Meta:
        model = ForumPost
        fields = ['id', 'title', 'content', 'created_by', 'created_at', 'updated_at', 'comments', 'community']
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'community']