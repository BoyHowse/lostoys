export type Locale = "en" | "es";

export type TranslationValue = string | { [key: string]: TranslationValue };
export type TranslationDictionary = Record<string, TranslationValue>;

const translations: Record<Locale, TranslationDictionary> = {
  en: {
    header: {
      nav: { dashboard: "Dashboard", upcoming: "Upcoming", settings: "Alerts" },
      signIn: "Sign in",
      logout: "Logout",
      loggedAs: "Logged as",
      language: "Language",
      languageShort: { en: "EN", es: "ES" },
    },
    loading: {
      default: "Loading data",
      booting: "Booting console",
      syncingVehicles: "Synchronising vehicles",
      scanningDocuments: "Scanning documents",
      loading: "Loading",
      loadingVehicle: "Loading vehicle",
    },
    vehicleCard: {
      statuses: { green: "Up to date", yellow: "30 days", red: "Overdue" },
      labels: {
        year: "Year",
        value: "Estimated value",
        status: "Status",
        nextDocument: "Next document",
        noDocuments: "No documents registered yet",
        documents: "Documents",
        vehicle: "Vehicle #",
      },
      actions: {
        details: "View details",
      },
    },
    common: {
      statuses: {
        car: { active: "Active", sold: "Sold", inactive: "Inactive" },
        alerts: { sent: "sent", failed: "failed", pending: "pending" },
        notificationTypes: { email: "Email", whatsapp: "WhatsApp", sms: "SMS" },
      },
      words: {
        expired: "Expired",
        day: "day",
        days: "days",
      },
    },
    documents: {
      aiStatus: {
        pending: "Pending review",
        processing: "Processing",
        completed: "Verified",
        warning: "Needs attention",
        failed: "Error",
      },
    },
    dashboard: {
      guestTitle: "Welcome to LosToys",
      guestDescription:
        "Keep every document, payment, and maintenance record under control. Sign in to access your fleet console or create a new account.",
      buttons: {
        signIn: "Sign in",
        createAccount: "Create account",
        addVehicle: "Add vehicle",
      },
      title: "Fleet Dashboard",
      subtitle:
        "Monitor vehicle compliance at a glance. Status badges switch from green to yellow 15 days before an expiry and red when already overdue.",
      stats: {
        total: "Total vehicles",
        green: "Up to date",
        yellow: "30 days",
        red: "Overdue",
      },
      sections: {
        overview: "Vehicles overview",
      },
      empty: {
        title: "No vehicles yet",
        description:
          "Register your first toy to start tracking documents, credits, and maintenance plans.",
      },
      error: "Unable to load vehicles",
    },
    auth: {
      loading: "Loading",
      login: {
        title: "Access Console",
        description:
          "Use your credentials to enter LosToys. Sessions are secured with HTTP-only cookies.",
        username: "Username",
        password: "Password",
        submit: "Sign in",
        submitting: "Signing in",
        needAccount: "Need an account?",
        createOne: "Create one",
        error: "Unable to sign in",
      },
      register: {
        title: "Create Account",
        description:
          "Build your LosToys workspace and start monitoring your personal or company fleet.",
        username: "Username",
        email: "Email",
        password: "Password",
        firstName: "First name",
        lastName: "Last name",
        phone: "Phone",
        submit: "Create account",
        submitting: "Creating",
        haveAccount: "Already registered?",
        signIn: "Sign in",
        error: "Unable to register",
        successTitle: "Account created",
        successMessage: "Your account was created. Check your inbox to activate it.",
        goToLogin: "Go to login",
        backHome: "Back to dashboard",
      },
      demoCredentials: "Demo credentials: demo / demo1234",
    },
    settings: {
      signInNotice: "Sign in to configure alert preferences.",
      title: "Alert preferences",
      description:
        "Choose how you want to be informed when a document or payment is due. LosToys will trigger email, WhatsApp, or SMS notifications 30, 15, and 7 days before an expiry.",
      toggles: {
        email: {
          title: "Email alerts",
          description: "Send expiration alerts to my email inbox.",
        },
        sms: {
          title: "SMS alerts",
          description: "Send SMS reminders using Twilio.",
        },
        whatsapp: {
          title: "WhatsApp alerts",
          description: "Receive WhatsApp notifications through Twilio.",
        },
      },
      phone: {
        label: "Phone number",
        helper: "Required for SMS and WhatsApp notifications.",
        placeholder: "+57 300 1234567",
      },
      feedback: {
        saved: "Preferences saved",
        error: "Failed to save settings",
      },
      buttons: {
        save: "Save preferences",
        saving: "Saving",
      },
    },
    upcoming: {
      signInNotice: "Sign in to check upcoming expirations.",
      title: "Upcoming expirations",
      description:
        "All documents expiring within the next 30 days, sorted by urgency.",
      empty: {
        title: "No expirations in the next 30 days",
        description:
          "You are all set. LosToys will list upcoming items here as soon as they fall into the alert window.",
      },
      table: {
        vehicle: "Vehicle",
        document: "Document",
        expiry: "Expiry",
        daysLeft: "Days left",
        status: "Status",
      },
    },
    newCar: {
      signInNotice: "Sign in to add vehicles.",
      title: "Add vehicle",
      description:
        "Register a vehicle to start tracking documents, credits, and maintenance.",
      fields: {
        brand: "Brand",
        model: "Model",
        plate: "Plate",
        year: "Year",
        estimatedValue: "Estimated value (USD)",
        status: "Status",
      },
      statusOptions: {
        active: "Active",
        sold: "Sold",
        inactive: "Inactive",
      },
      feedback: {
        error: "Unable to create car",
      },
      buttons: {
        submit: "Create vehicle",
        saving: "Saving",
      },
    },
    documentForm: {
      title: "Upload document",
      description:
        "Attach a clear scan or photo. LosToys will validate Colombian transit licenses automatically.",
      fields: {
        type: "Document type",
        provider: "Issuer",
        issueDate: "Issue date",
        expiryDate: "Expiry date",
        amount: "Amount (optional)",
        notes: "Notes",
        file: "Document image",
      },
      placeholders: {
        provider: "Entity or office",
        notes: "Additional info or observations",
      },
      types: {
        transitLicense: "Transit license",
        soat: "SOAT",
        technomechanical: "Technomechanical inspection",
        insurance: "Insurance",
        registration: "Registration card",
      },
      licenseHint:
        "If your workspace is set to Colombia we start with the 'Licencia de Tránsito'. Make sure that text is visible in the photo.",
      aiNote:
        "After uploading we will run an AI check in the background so you can continue working without waiting here.",
      fileHelp: "Accepted formats: JPG, PNG or PDF — maximum 8MB.",
      buttons: {
        submit: "Save document",
        saving: "Saving",
        back: "Back to vehicle",
        showDetails: "Details",
      },
      errors: {
        fileRequired: "Please attach an image for this document.",
      },
      detailsHint: "Details are filled automatically after upload.",
    },
    carDetail: {
      signInNotice: "Sign in to view vehicle details.",
      missingNotice: {
        title: "Vehicle not specified",
        description:
          "Provide a valid vehicle identifier to access its details.",
      },
      notFound: {
        title: "Vehicle not found",
        description: "This record is not available or you do not have access.",
      },
      sections: {
        documents: "Documents",
        soat: "SOAT",
        credits: "Credits",
        maintenance: "Maintenance",
        notifications: "Notifications",
        history: "History",
        maintenanceLog: "Maintenance log",
        timeline: "Activity timeline",
      },
      vehicleCard: {
        vehicleNumber: "Vehicle #",
        statusLabel: "Status",
        estimatedValue: "Estimated value",
        edit: "Edit vehicle",
      },
      buttons: {
        addDocument: "Add document",
        addCredit: "Add credit",
        addMaintenance: "Add maintenance",
      },
      documents: {
        emptyTitle: "No documents registered",
        emptyDescription:
          "Register SOAT, tecnomecánica, insurance or other compliance documents to start receiving alerts.",
        columns: {
          type: "Type",
          provider: "Provider",
          issue: "Issue",
          expiry: "Expiry",
          amount: "Amount",
          status: "Status",
          validation: "AI validation",
          file: "File",
        },
        warningTitle: "We need a clearer copy",
        warningDescription:
          "Some transit licenses could not be read. Upload a sharper image to keep compliance up to date.",
        warningCountLabel: "documents",
        actions: {
          viewFile: "View file",
        },
        badges: {
          valid: "Valid",
        },
        validationMessages: {
          valid: "Document verified successfully.",
        },
      },
      credits: {
        emptyTitle: "No credits",
        emptyDescription:
          "Register financial obligations to track payment days and outstanding balances.",
        totalAmount: "Total amount",
        monthlyPayment: "Monthly payment",
        remainingBalance: "Remaining balance",
        nextPayment: "Next payment",
      },
      maintenance: {
        emptyTitle: "No maintenance records",
        emptyDescription:
          "Register garage visits, repairs, and inspections to keep a full history.",
        unknownWorkshop: "Unknown",
      },
      notifications: {
        emptyTitle: "No notifications yet",
        emptyDescription:
          "Alerts generated by LosToys will be listed here once documents approach their due dates.",
      },
      history: {
        emptyTitle: "No history yet",
        emptyDescription:
          "Document and maintenance entries will appear here as a chronological activity feed.",
      },
      timeline: {
        expiresPrefix: "Expires",
      },
      soat: {
        title: "SOAT monitoring",
        subtitle: "We consult official SOAT services each time a policy is uploaded.",
        refresh: "Refresh data",
        refreshing: "Refreshing...",
        loading: "Gathering SOAT information…",
        documentData: "Document on file",
        officialData: "Official lookup",
        issueLabel: "Issue date",
        expiryLabel: "Expiry date",
        amountLabel: "Declared premium",
        providerLabel: "Provider",
        policyLabel: "Policy number",
        insurerLabel: "Insurer",
        responsibilities: "Coverage & responsibilities",
        noResponsibilities: "The provider did not return coverage details.",
        providerSource: "Source",
        lastSync: "Last sync",
        noSync: "Pending synchronization",
        statusLabel: "Status",
        statusUnknown: "Unknown",
        errorTitle: "SOAT lookup failed",
        emptyTitle: "No SOAT document",
        emptyDescription:
          "Upload the SOAT document for this vehicle to enable automated cross-checks.",
        noDate: "No date",
      },
    },
    placeholders: {
      documents:
        "Document creation UI is coming soon. Use the API endpoint POST /api/documents/ to register new records in the meantime.",
      credits:
        "Credit creation UI is coming soon. Use the API endpoint POST /api/credits/ to register new credit agreements for this vehicle.",
      maintenance:
        "Maintenance logging UI is coming soon. Use the API endpoint POST /api/maintenances/ to store garage visits for this vehicle.",
      editVehicle:
        "Vehicle editing UI is coming soon. Update data via PATCH /api/cars/:id/ while the interface is built.",
    },
    errors: {
      loadCar: "Unable to load car",
      loadSoat: "Unable to load SOAT information",
    },
  },
  es: {
    header: {
      nav: { dashboard: "Panel", upcoming: "Próximos", settings: "Alertas" },
      signIn: "Iniciar sesión",
      logout: "Cerrar sesión",
      loggedAs: "Conectado como",
      language: "Idioma",
      languageShort: { en: "EN", es: "ES" },
    },
    loading: {
      default: "Cargando datos",
      booting: "Iniciando consola",
      syncingVehicles: "Sincronizando vehículos",
      scanningDocuments: "Analizando documentos",
      loading: "Cargando",
      loadingVehicle: "Cargando vehículo",
    },
    vehicleCard: {
      statuses: { green: "AL DÍA", yellow: "30 DÍAS", red: "VENCIDO" },
      labels: {
        year: "Año",
        value: "Valor estimado",
        status: "Estado",
        nextDocument: "Próximo documento",
        noDocuments: "Aún no hay documentos registrados",
        documents: "Documentos",
        vehicle: "Vehículo #",
      },
      actions: {
        details: "Ver detalle",
      },
    },
    common: {
      statuses: {
        car: { active: "Activo", sold: "Vendido", inactive: "Inactivo" },
        alerts: { sent: "enviada", failed: "falló", pending: "pendiente" },
        notificationTypes: {
          email: "Correo electrónico",
          whatsapp: "WhatsApp",
          sms: "SMS",
        },
      },
      words: {
        expired: "Vencido",
        day: "día",
        days: "días",
      },
    },
    documents: {
      aiStatus: {
        pending: "Pendiente",
        processing: "Procesando",
        completed: "Verificado",
        warning: "Con advertencias",
        failed: "Error",
      },
    },
    dashboard: {
      guestTitle: "Bienvenido a LosToys",
      guestDescription:
        "Mantén bajo control documentos, pagos y mantenimientos. Inicia sesión para entrar a tu consola o crea una cuenta nueva.",
      buttons: {
        signIn: "Iniciar sesión",
        createAccount: "Crear cuenta",
        addVehicle: "Agregar vehículo",
      },
      title: "Panel de flota",
      subtitle:
        "Controla el cumplimiento de tus vehículos. Los indicadores cambian de verde a amarillo 15 días antes del vencimiento y a rojo cuando ya expiró.",
      stats: {
        total: "Vehículos totales",
        green: "AL DÍA",
        yellow: "30 DÍAS",
        red: "VENCIDO",
      },
      sections: {
        overview: "Resumen de vehículos",
      },
      empty: {
        title: "Todavía no hay vehículos",
        description:
          "Registra tu primer juguete para empezar a controlar documentos, créditos y mantenimientos.",
      },
      error: "No fue posible cargar los vehículos",
    },
    auth: {
      loading: "Cargando",
      login: {
        title: "Acceder a la consola",
        description:
          "Usa tus credenciales para entrar a LosToys. Las sesiones se protegen con cookies HTTP-only.",
        username: "Usuario",
        password: "Contraseña",
        submit: "Iniciar sesión",
        submitting: "Entrando",
        needAccount: "¿Necesitas una cuenta?",
        createOne: "Crear una",
        error: "No fue posible iniciar sesión",
      },
      register: {
        title: "Crear cuenta",
        description:
          "Construye tu espacio LosToys y comienza a monitorear tu flota personal o empresarial.",
        username: "Usuario",
        email: "Correo",
        password: "Contraseña",
        firstName: "Nombre",
        lastName: "Apellido",
        phone: "Teléfono",
        submit: "Crear cuenta",
        submitting: "Creando",
        haveAccount: "¿Ya tienes cuenta?",
        signIn: "Inicia sesión",
        error: "No fue posible registrar la cuenta",
        successTitle: "Cuenta creada",
        successMessage: "Tu cuenta fue creada. Revisa tu correo para activarla.",
        goToLogin: "Ir al login",
        backHome: "Volver al panel",
      },
      demoCredentials: "Credenciales demo: demo / demo1234",
    },
    settings: {
      signInNotice: "Inicia sesión para configurar las alertas.",
      title: "Preferencias de alertas",
      description:
        "Elige cómo quieres que te avisemos cuando un documento o pago esté por vencer. LosToys enviará correos, WhatsApp o SMS 30, 15 y 7 días antes.",
      toggles: {
        email: {
          title: "Alertas por correo",
          description: "Recibir recordatorios de expiración en mi correo.",
        },
        sms: {
          title: "Alertas por SMS",
          description: "Enviar recordatorios por SMS usando Twilio.",
        },
        whatsapp: {
          title: "Alertas por WhatsApp",
          description: "Recibir notificaciones por WhatsApp a través de Twilio.",
        },
      },
      phone: {
        label: "Número de teléfono",
        helper: "Requerido para alertas por SMS y WhatsApp.",
        placeholder: "+57 300 1234567",
      },
      feedback: {
        saved: "Preferencias guardadas",
        error: "No se pudo guardar la configuración",
      },
      buttons: {
        save: "Guardar preferencias",
        saving: "Guardando",
      },
    },
    upcoming: {
      signInNotice: "Inicia sesión para ver los próximos vencimientos.",
      title: "Próximos vencimientos",
      description:
        "Documentos que vencen en los próximos 30 días ordenados por urgencia.",
      empty: {
        title: "No hay vencimientos en los próximos 30 días",
        description:
          "Todo está bajo control. LosToys mostrará aquí los ítems cuando entren en la ventana de alerta.",
      },
      table: {
        vehicle: "Vehículo",
        document: "Documento",
        expiry: "Vencimiento",
        daysLeft: "Días restantes",
        status: "Estado",
      },
    },
    newCar: {
      signInNotice: "Inicia sesión para agregar vehículos.",
      title: "Agregar vehículo",
      description:
        "Registra un vehículo para comenzar a controlar documentos, créditos y mantenimientos.",
      fields: {
        brand: "Marca",
        model: "Modelo",
        plate: "Placa",
        year: "Año",
        estimatedValue: "Valor estimado (USD)",
        status: "Estado",
      },
      statusOptions: {
        active: "Activo",
        sold: "Vendido",
        inactive: "Inactivo",
      },
      feedback: {
        error: "No fue posible crear el vehículo",
      },
      buttons: {
        submit: "Crear vehículo",
        saving: "Guardando",
      },
    },
    documentForm: {
      title: "Agregar documento",
      description:
        "Adjunta una foto o escaneo legible. LosToys validará automáticamente las licencias de tránsito colombianas.",
      fields: {
        type: "Tipo de documento",
        provider: "Entidad",
        issueDate: "Fecha de expedición",
        expiryDate: "Fecha de vencimiento",
        amount: "Valor (opcional)",
        notes: "Notas",
        file: "Imagen del documento",
      },
      placeholders: {
        provider: "Oficina o entidad",
        notes: "Información adicional u observaciones",
      },
      types: {
        transitLicense: "Licencia de tránsito",
        soat: "SOAT",
        technomechanical: "Tecnomecánica",
        insurance: "Seguro",
        registration: "Matrícula",
      },
      licenseHint:
        "Si tu cuenta está en Colombia comenzamos con la 'Licencia de Tránsito'. Asegúrate de que ese texto sea visible en la foto.",
      aiNote:
        "Luego de subir el archivo lo analizaremos con IA en segundo plano para que puedas seguir trabajando sin esperar aquí.",
      fileHelp: "Formatos aceptados: JPG, PNG o PDF — máximo 8MB.",
      buttons: {
        submit: "Guardar documento",
        saving: "Guardando",
        back: "Volver al vehículo",
        showDetails: "Detalles",
      },
      errors: {
        fileRequired: "Adjunta una imagen para este documento.",
      },
      detailsHint: "Los detalles se completarán automáticamente después de subir el archivo.",
    },
    carDetail: {
      signInNotice: "Inicia sesión para ver el detalle del vehículo.",
      missingNotice: {
        title: "Vehículo no especificado",
        description:
          "Proporciona un identificador válido para acceder a la información.",
      },
      notFound: {
        title: "Vehículo no encontrado",
        description: "Este registro no existe o no tienes acceso.",
      },
      sections: {
        documents: "Documentos",
        soat: "SOAT",
        credits: "Créditos",
        maintenance: "Mantenimientos",
        notifications: "Notificaciones",
        history: "Historial",
        maintenanceLog: "Bitácora de mantenimiento",
        timeline: "Línea de tiempo",
      },
      vehicleCard: {
        vehicleNumber: "Vehículo #",
        statusLabel: "Estado",
        estimatedValue: "Valor estimado",
        edit: "Editar vehículo",
      },
      buttons: {
        addDocument: "Agregar documento",
        addCredit: "Agregar crédito",
        addMaintenance: "Agregar mantenimiento",
      },
      documents: {
        emptyTitle: "Sin documentos registrados",
        emptyDescription:
          "Registra SOAT, tecnomecánica, seguros u otros documentos para empezar a recibir alertas.",
        columns: {
          type: "Tipo",
          provider: "Proveedor",
          issue: "Emisión",
          expiry: "Vencimiento",
          amount: "Monto",
          status: "Estado",
          validation: "Validación IA",
          file: "Archivo",
        },
        warningTitle: "Necesitamos una copia más clara",
        warningDescription:
          "Algunas licencias de tránsito no pudieron leerse. Sube una imagen más nítida para mantener los vencimientos al día.",
        warningCountLabel: "documentos",
        actions: {
          viewFile: "Ver archivo",
        },
        badges: {
          valid: "Válido",
        },
        validationMessages: {
          valid: "Documento verificado correctamente.",
        },
      },
      credits: {
        emptyTitle: "Sin créditos",
        emptyDescription:
          "Registra obligaciones financieras para controlar fechas y saldos pendientes.",
        totalAmount: "Monto total",
        monthlyPayment: "Pago mensual",
        remainingBalance: "Saldo pendiente",
        nextPayment: "Próximo pago",
      },
      maintenance: {
        emptyTitle: "Sin registros de mantenimiento",
        emptyDescription:
          "Registra visitas a taller, reparaciones e inspecciones para conservar el historial.",
        unknownWorkshop: "Desconocido",
      },
      notifications: {
        emptyTitle: "Sin notificaciones aún",
        emptyDescription:
          "Las alertas generadas por LosToys aparecerán aquí cuando los documentos estén por vencer.",
      },
      history: {
        emptyTitle: "Sin historial aún",
        emptyDescription:
          "Los documentos y mantenimientos registrados aparecerán en orden cronológico.",
      },
      timeline: {
        expiresPrefix: "Expira",
      },
      soat: {
        title: "Seguimiento del SOAT",
        subtitle:
          "Cada vez que adjuntas la póliza consultamos la información oficial disponible.",
        refresh: "Actualizar consulta",
        refreshing: "Actualizando...",
        loading: "Consultando información oficial…",
        documentData: "Documento registrado",
        officialData: "Consulta oficial",
        issueLabel: "Fecha de expedición",
        expiryLabel: "Fecha de vencimiento",
        amountLabel: "Prima declarada",
        providerLabel: "Proveedor registrado",
        policyLabel: "Número de póliza",
        insurerLabel: "Aseguradora oficial",
        responsibilities: "Coberturas y responsabilidades",
        noResponsibilities: "El proveedor no entregó detalle de coberturas.",
        providerSource: "Fuente",
        lastSync: "Última sincronización",
        noSync: "Pendiente por sincronizar",
        statusLabel: "Estado",
        statusUnknown: "Desconocido",
        errorTitle: "No pudimos consultar el SOAT",
        emptyTitle: "Sin SOAT registrado",
        emptyDescription:
          "Carga la póliza SOAT para habilitar la consulta automática de vencimientos y coberturas.",
        noDate: "Sin dato",
      },
    },
    placeholders: {
      documents:
        "La interfaz para crear documentos llegará pronto. Usa el endpoint POST /api/documents/ para registrar nuevos documentos mientras tanto.",
      credits:
        "La interfaz para crear créditos llegará pronto. Usa el endpoint POST /api/credits/ para registrar obligaciones financieras.",
      maintenance:
        "La interfaz para registrar mantenimientos llegará pronto. Usa el endpoint POST /api/maintenances/ para guardar visitas al taller.",
      editVehicle:
        "La interfaz de edición llegará pronto. Actualiza por ahora con PATCH /api/cars/:id/.",
    },
    errors: {
      loadCar: "No fue posible cargar el vehículo",
      loadSoat: "No fue posible obtener datos del SOAT",
    },
  },
};

export default translations;
