from django.contrib.auth.models import User
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
    RecommendedProduct
)

class UserSerializer(serializers.ModelSerializer):
    communities = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'date_joined', 'communities']
        # Note: We exclude password field for security

    def get_communities(self, obj):
        communities = obj.communities.all()
        return [{
            'id': community.id,
            'name': community.name,
            'description': community.description,
            'banner_image': community.banner_image.url if community.banner_image else None
        } for community in communities]

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'password')

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password']
        )
        return user

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class CommunitySerializer(serializers.ModelSerializer):
    is_creator = serializers.SerializerMethodField()
    created_by = serializers.ReadOnlyField(source='created_by.username')
    
    class Meta:
        model = Community
        fields = ['id', 'name', 'description', 'created_by', 'created_at', 'is_creator', 'banner_image']

    def get_is_creator(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.created_by == request.user
        return False

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

