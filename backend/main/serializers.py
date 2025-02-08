from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import (
    Community, 
    GalleryImage, 
    ResourceCategory, 
    Resource, 
    ForumPost, 
    ForumComment, 
    Reaction, 
    Question,
    Answer, 
    AnswerVote,
    QuestionVote,
    Poll,
    PollOption,
    Announcement,
    RecommendedProduct,
    SavedImage,
    SavedResource,
    SavedProduct,
    SavedCollection,
    Profile
)
from .utils import get_preview_data  # Add this import at the top
from django.utils import timezone
from datetime import timedelta
from django.conf import settings

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    communities = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'date_joined', 'communities', 'password', 'confirm_password']
        extra_kwargs = {
            'password': {'write_only': True},
            'confirm_password': {'write_only': True}
        }

    def get_communities(self, obj):
        communities = obj.communities.all()
        return [{
            'id': community.id,
            'name': community.name,
            'description': community.description,
            'banner_image': community.banner_image.url if community.banner_image else None
        } for community in communities]

    def validate(self, data):
        if data.get('password') != data.get('confirm_password'):
            raise serializers.ValidationError("Passwords don't match")
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')  # Remove confirm_password from the data
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password')

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("This username is already taken.")
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value

    def create(self, validated_data):
        try:
            user = User.objects.create_user(
                username=validated_data['username'],
                email=validated_data['email'],
                password=validated_data['password']
            )
            return user
        except Exception as e:
            raise serializers.ValidationError(str(e))

class UserLoginSerializer(serializers.Serializer):
    identifier = serializers.CharField()  # This can be email or username
    password = serializers.CharField(write_only=True)

class CommunitySerializer(serializers.ModelSerializer):
    is_creator = serializers.SerializerMethodField()
    created_by = serializers.ReadOnlyField(source='created_by.username')
    member_count = serializers.SerializerMethodField()
    recent_views = serializers.SerializerMethodField()
    banner_image = serializers.SerializerMethodField()
    
    class Meta:
        model = Community
        fields = ['id', 'name', 'description', 'created_by', 'created_at', 'is_creator', 'banner_image', 'member_count', 'recent_views']

    def get_is_creator(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.created_by == request.user
        return False

    def get_member_count(self, obj):
        return obj.members.count()

    def get_recent_views(self, obj):
        thirty_days_ago = timezone.now() - timedelta(days=30)
        return obj.views.filter(viewed_at__gte=thirty_days_ago).count()

    def get_banner_image(self, obj):
        if obj.banner_image and obj.banner_image.url:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.banner_image.url)
            return obj.banner_image.url
        return None

class GalleryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryImage
        fields = ['id', 'image', 'uploaded_by', 'uploaded_at', 'community']
        read_only_fields = ['uploaded_by', 'uploaded_at']

class ResourceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceCategory
        fields = ['id', 'name', 'description', 'preview_image', 'created_at', 'community', 'created_by']
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
        fields = ['id', 'title', 'url', 'remark', 'category', 'created_by', 'created_at']

class ForumCommentSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = ForumComment
        fields = ['id', 'content', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['created_by', 'created_at', 'updated_at']

class ReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reaction
        fields = ['id', 'reaction_type', 'user']

class ForumPostSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    reactions_count = serializers.SerializerMethodField()
    user_reactions = serializers.SerializerMethodField()
    comments = ForumCommentSerializer(many=True, read_only=True)
    
    class Meta:
        model = ForumPost
        fields = [
            'id', 'content', 'media', 'media_type', 
            'created_by', 'created_at', 'reactions_count',
            'user_reactions', 'comments', 'community'
        ]
        read_only_fields = ['created_by', 'created_at']

    def get_reactions_count(self, obj):
        counts = {}
        for reaction_type, _ in Reaction.REACTION_TYPES:
            counts[reaction_type] = obj.reactions.filter(reaction_type=reaction_type).count()
        return counts
    
    def get_user_reactions(self, obj):
        user = self.context['request'].user
        if user.is_authenticated:
            return list(obj.reactions.filter(user=user).values_list('reaction_type', flat=True))
        return []

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        request = self.context.get('request')
        if representation['media'] and request:
            representation['media'] = request.build_absolute_uri(instance.media.url)
        return representation

class UserProfileSerializer(serializers.ModelSerializer):
    communities = CommunitySerializer(many=True, read_only=True)
    created_communities = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'date_joined', 'communities', 'created_communities']

    def get_created_communities(self, obj):
        communities = Community.objects.filter(created_by=obj)
        return CommunitySerializer(communities, many=True).data

class AnswerSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    user_vote = serializers.SerializerMethodField()
    votes = serializers.IntegerField(read_only=True)

    class Meta:
        model = Answer
        fields = ['id', 'content', 'created_by', 'created_at', 'votes', 'user_vote']
        read_only_fields = ['created_by', 'votes']

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                vote = AnswerVote.objects.get(answer=obj, user=request.user)
                return vote.vote_type
            except AnswerVote.DoesNotExist:
                return None
        return None

class QuestionSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    answers = AnswerSerializer(many=True, read_only=True)
    votes = serializers.SerializerMethodField()
    user_vote = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ['id', 'content', 'created_by', 'created_at', 'media', 'answers', 'votes', 'user_vote']

    def get_votes(self, obj):
        upvotes = obj.question_votes.filter(vote_type='up').count()
        downvotes = obj.question_votes.filter(vote_type='down').count()
        return upvotes - downvotes

    def get_user_vote(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            try:
                vote = QuestionVote.objects.get(question=obj, user=request.user)
                return vote.vote_type
            except QuestionVote.DoesNotExist:
                return None
        return None

class PollOptionSerializer(serializers.ModelSerializer):
    vote_count = serializers.SerializerMethodField()
    has_voted = serializers.SerializerMethodField()

    class Meta:
        model = PollOption
        fields = ['id', 'text', 'vote_count', 'has_voted']

    def get_vote_count(self, obj):
        return obj.vote_count()

    def get_has_voted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.votes.filter(id=request.user.id).exists()
        return False

class PollSerializer(serializers.ModelSerializer):
    options = PollOptionSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Poll
        fields = ['id', 'question', 'created_by', 'created_at', 'options']

class AnnouncementSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Announcement
        fields = ['id', 'content', 'created_by', 'created_at']
        read_only_fields = ['created_by', 'created_at']

class RecommendedProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = RecommendedProduct
        fields = ['id', 'title', 'url', 'comment', 'catalogue_name', 'community', 'created_by', 'created_at']
        read_only_fields = ['created_at']

class SavedImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    community_name = serializers.SerializerMethodField()
    community_id = serializers.SerializerMethodField()

    class Meta:
        model = SavedImage
        fields = ['id', 'image', 'image_url', 'community_name', 'community_id', 'saved_at']

    def get_image_url(self, obj):
        return obj.image.image.url if obj.image.image else None

    def get_community_name(self, obj):
        return obj.image.community.name if obj.image.community else None

    def get_community_id(self, obj):
        return obj.image.community.id if obj.image.community else None

class SavedResourceSerializer(serializers.ModelSerializer):
    resource_id = serializers.IntegerField(source='resource.id')
    title = serializers.SerializerMethodField()
    url = serializers.SerializerMethodField()
    collection_name = serializers.SerializerMethodField()
    community_id = serializers.SerializerMethodField()
    preview_image = serializers.SerializerMethodField()
    preview_data = serializers.SerializerMethodField()

    class Meta:
        model = SavedResource
        fields = ['id', 'resource_id', 'title', 'url', 'collection_name', 
                 'community_id', 'saved_at', 'preview_image', 'preview_data']

    def get_preview_image(self, obj):
        try:
            preview_data = get_preview_data(obj.resource.url)
            if preview_data and preview_data.get('image'):
                return preview_data['image']
        except Exception as e:
            print(f"Error getting preview for {obj.resource.url}: {str(e)}")
        return None

    def get_preview_data(self, obj):
        try:
            return get_preview_data(obj.resource.url)
        except Exception as e:
            print(f"Error getting preview data for {obj.resource.url}: {str(e)}")
        return None

    def get_title(self, obj):
        return obj.resource.title

    def get_url(self, obj):
        return obj.resource.url

    def get_collection_name(self, obj):
        return obj.resource.category.name if obj.resource.category else None

    def get_community_id(self, obj):
        return obj.resource.category.community.id

class SavedProductSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source='product.id')
    title = serializers.CharField(source='product.title')
    url = serializers.CharField(source='product.url')
    catalogue_name = serializers.CharField(source='product.catalogue_name')
    community_id = serializers.IntegerField(source='product.community.id')

    class Meta:
        model = SavedProduct
        fields = ['id', 'product_id', 'title', 'url', 'catalogue_name', 'community_id', 'saved_at']

class SavedCollectionSerializer(serializers.ModelSerializer):
    collection_id = serializers.IntegerField(source='collection.id')
    name = serializers.CharField(source='collection.name')
    community_id = serializers.IntegerField(source='collection.community.id')
    community_name = serializers.CharField(source='collection.community.name')
    resource_count = serializers.SerializerMethodField()
    views = serializers.IntegerField(source='collection.views', default=0)
    preview_image = serializers.CharField(source='collection.preview_image')

    class Meta:
        model = SavedCollection
        fields = ['id', 'collection_id', 'name', 'community_id', 'community_name', 
                 'resource_count', 'views', 'saved_at', 'preview_image']

    def get_resource_count(self, obj):
        return Resource.objects.filter(category=obj.collection).count()

class ProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Profile
        fields = ['username', 'email', 'bio', 'avatar']

