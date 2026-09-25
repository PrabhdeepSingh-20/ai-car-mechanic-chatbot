from rest_framework import serializers

from .models import Conversation, Message, Diagnosis, Booking, UploadedMedia


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "role", "content", "created_at"]


class ConversationSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta:
        model = Conversation
        fields = ["id", "created_at", "messages"]


class DiagnosisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Diagnosis
        fields = [
            "id",
            "conversation",
            "problem",
            "possible_cause",
            "recommendation",
            "created_at",
        ]


class BookingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            "id",
            "diagnosis",
            "customer_name",
            "phone",
            "preferred_date",
            "preferred_time",
            "created_at",
        ]
class UploadedMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedMedia
        fields = [
            "id",
            "conversation",
            "file",
            "media_type",
            "created_at",
        ]