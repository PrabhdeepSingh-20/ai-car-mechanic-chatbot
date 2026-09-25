from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Conversation, Message, Diagnosis, Booking, UploadedMedia
from .serializers import (
    ConversationSerializer,
    DiagnosisSerializer,
    BookingSerializer,
    UploadedMediaSerializer,
)
from .gemini_service import analyze_car_image
from .mechanic_logic import diagnose_car


class ChatView(APIView):
    """
    Create a conversation message and return a mechanic response.
    """

    def post(self, request):
        message_text = str(request.data.get("message", "")).strip()
        conversation_id = request.data.get("conversation_id")

        if not message_text:
            return Response(
                {"error": "Message is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if conversation_id:
            conversation = get_object_or_404(
                Conversation,
                id=conversation_id,
            )
        else:
            conversation = Conversation.objects.create()

        Message.objects.create(
            conversation=conversation,
            role="user",
            content=message_text,
        )

        diagnosis = diagnose_car(message_text)

        if diagnosis:
            assistant_text = (
                f"I may have identified the issue as: "
                f"{diagnosis['problem']}. "
                "Before I give you a final diagnosis, please provide "
                "any additional symptoms, dashboard warning lights, "
                "or unusual sounds you have noticed."
            )
        else:
            assistant_text = (
                "I'd be happy to help diagnose your car. "
                "Please tell me the car's make, model, approximate year, "
                "what happened, and the exact symptoms you are experiencing."
            )

        Message.objects.create(
            conversation=conversation,
            role="assistant",
            content=assistant_text,
        )

        return Response(
            {
                "conversation_id": conversation.id,
                "message": assistant_text,
            },
            status=status.HTTP_200_OK,
        )


class UploadView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        uploaded_file = request.FILES.get("file")

        if not uploaded_file:
            return Response(
                {"error": "A file is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        conversation_id = request.data.get("conversation_id")

        if conversation_id:
            conversation = get_object_or_404(
                Conversation,
                id=conversation_id,
            )
        else:
            conversation = Conversation.objects.create()

        content_type = uploaded_file.content_type or ""

        if content_type.startswith("image/"):
            media_type = "image"
        elif content_type.startswith("audio/"):
            media_type = "audio"
        elif content_type.startswith("video/"):
            media_type = "video"
        else:
            return Response(
                {
                    "error": (
                        "Unsupported file type. "
                        "Please upload an image, audio, or video file."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        media = UploadedMedia.objects.create(
            conversation=conversation,
            file=uploaded_file,
            media_type=media_type,
        )

        response_data = {
            "message": "File uploaded successfully.",
            "conversation_id": conversation.id,
            "media": UploadedMediaSerializer(
                media,
                context={"request": request},
            ).data,
        }

        # Use Gemini only for images, where visual AI analysis is useful.
        if media_type == "image":
            try:
                uploaded_file.seek(0)
                analysis = analyze_car_image(uploaded_file)
                response_data["analysis"] = analysis
            except Exception:
                response_data["analysis"] = (
                    "The image was uploaded successfully, "
                    "but AI analysis is temporarily unavailable."
                )

        return Response(
            response_data,
            status=status.HTTP_201_CREATED,
        )


class DiagnosisView(APIView):
    """
    Generate and store a diagnosis using the rule-based mechanic logic.
    """

    def post(self, request):
        conversation_id = request.data.get("conversation_id")
        message_text = str(request.data.get("message", "")).strip()

        if not conversation_id:
            return Response(
                {"error": "conversation_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        conversation = get_object_or_404(
            Conversation,
            id=conversation_id,
        )

        if not message_text:
            latest_message = (
                Message.objects
                .filter(
                    conversation=conversation,
                    role="user",
                )
                .order_by("-created_at")
                .first()
            )

            if latest_message:
                message_text = latest_message.content

        if not message_text:
            return Response(
                {"error": "A symptom message is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        diagnosis_data = diagnose_car(message_text)

        if not diagnosis_data:
            return Response(
                {
                    "diagnosis_available": False,
                    "message": (
                        "I need more information before I can provide "
                        "a useful diagnosis. Please describe the symptoms "
                        "in more detail."
                    ),
                },
                status=status.HTTP_200_OK,
            )

        diagnosis, created = Diagnosis.objects.update_or_create(
            conversation=conversation,
            defaults=diagnosis_data,
        )

        serializer = DiagnosisSerializer(diagnosis)

        return Response(
            {
                "diagnosis_available": True,
                "created": created,
                "diagnosis": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class BookingView(APIView):
    """
    Create a mechanic booking after a diagnosis.
    """

    def post(self, request):
        serializer = BookingSerializer(data=request.data)

        if serializer.is_valid():
            booking = serializer.save()

            return Response(
                {
                    "message": "Mechanic booking created successfully.",
                    "booking": BookingSerializer(booking).data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class BookingDetailView(APIView):
    """
    Retrieve a mechanic booking by ID.
    """

    def get(self, request, booking_id):
        booking = get_object_or_404(
            Booking,
            id=booking_id,
        )

        return Response(
            BookingSerializer(booking).data,
            status=status.HTTP_200_OK,
        )
