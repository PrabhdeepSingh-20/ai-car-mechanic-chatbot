from django.urls import path

from .views import (
    ChatView,
    UploadView,
    DiagnosisView,
    BookingView,
    BookingDetailView,
)


urlpatterns = [
    path("chat/", ChatView.as_view(), name="chat"),
    path("upload/", UploadView.as_view(), name="upload"),
    path("diagnosis/", DiagnosisView.as_view(), name="diagnosis"),
    path("booking/", BookingView.as_view(), name="booking"),
    path(
        "booking/<int:booking_id>/",
        BookingDetailView.as_view(),
        name="booking-detail",
    ),
]