from django.contrib import admin

from .models import Car, CarImageCatalog, Credit, Document, Maintenance


class DocumentInline(admin.TabularInline):
    model = Document
    extra = 0


@admin.register(Car)
class CarAdmin(admin.ModelAdmin):
    list_display = ("plate", "brand", "model", "year", "status", "user")
    list_filter = ("status", "year")
    search_fields = ("plate", "brand", "model", "user__username")
    inlines = [DocumentInline]


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("car", "type", "expiry_date", "status_indicator", "ai_status")
    list_filter = ("type", "expiry_date", "ai_status")
    search_fields = ("car__plate", "provider")


@admin.register(Credit)
class CreditAdmin(admin.ModelAdmin):
    list_display = ("car", "bank", "total_amount", "remaining_balance", "payment_day")
    list_filter = ("bank",)
    search_fields = ("car__plate", "bank")


@admin.register(Maintenance)
class MaintenanceAdmin(admin.ModelAdmin):
    list_display = ("car", "concept", "date", "cost", "workshop")
    list_filter = ("date",)
    search_fields = ("car__plate", "concept", "workshop")


@admin.register(CarImageCatalog)
class CarImageCatalogAdmin(admin.ModelAdmin):
    list_display = ("brand", "model", "color_key", "created_at")
    search_fields = ("brand", "model", "color_key")
