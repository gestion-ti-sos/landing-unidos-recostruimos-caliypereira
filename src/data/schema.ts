import type { Section } from './types';
import { eq, not } from './conditions';

/**
 * ⚠️ LEE ESTO ANTES DE PUBLICAR
 *
 * Este esquema se construyó a partir de un resumen narrativo del formulario,
 * no del formulario fuente con los asteriscos marcados campo por campo.
 * Dos cosas quedaron como mejor inferencia y las marqué con TODO inline:
 *
 * 1. Sección 2 (requisitos): las opciones de "afectaciones" dicen basarse en
 *    "las cuatro del informe" — no tengo el texto de ese informe, así que
 *    puse 4 categorías placeholder. Cambialas por las reales antes de
 *    publicar (buscá "TODO: informe" en este archivo).
 * 2. El campo `required` de cada pregunta: el resumen solo confirma
 *    explícitamente cuáles son opcionales/obligatorias en varios casos
 *    puntuales (uso de imagen, correo, estrato, enlace de Maps,
 *    vulnerabilidad, "documento del concepto"). Para el resto inferí lo más
 *    razonable dado el propósito de cada sección. El documento fuente dice
 *    39 preguntas obligatorias en total — contá las `required: true` /
 *    `requiredIf` de abajo y ajustá si no coincide con el formulario real.
 */

export const sections: Section[] = [
  // ────────────────────────────────────────────────────────────────
  // 1. AUTORIZACIONES — 4 preguntas
  // ────────────────────────────────────────────────────────────────
  {
    id: 'autorizaciones',
    order: 1,
    eyebrow: 'Antes de empezar',
    title: 'Autorizaciones',
    description:
      'Necesitamos tu permiso para tres cosas puntuales. Podés leer el detalle de cada una antes de marcarla.',
    fields: [
      {
        id: 'consent_data_treatment',
        section: 1,
        type: 'consent',
        label: 'Tratamiento de datos personales',
        consentText:
          'Autorizo el tratamiento de mis datos personales conforme a la política de privacidad de la campaña.',
        required: true,
      },
      {
        id: 'consent_truthfulness',
        section: 1,
        type: 'consent',
        label: 'Veracidad de la información',
        consentText: 'Declaro que la información que voy a dar en este formulario es verdadera.',
        required: true,
      },
      {
        id: 'consent_no_payment',
        section: 1,
        type: 'consent',
        label: 'Postulación sin costo',
        consentText: 'Confirmo que nadie me cobró ni me pidió dinero por postularme a esta campaña.',
        required: true,
      },
      {
        id: 'image_use_authorization',
        section: 1,
        type: 'radio',
        label: '¿Autorizas el uso de tu imagen e historia para contar esta campaña?',
        note: 'No autorizar esto no afecta tu postulación.',
        required: false,
        options: [
          { value: 'si_con_nombre', label: 'Sí, con mi nombre' },
          { value: 'si_sin_nombre', label: 'Sí, pero sin mencionar mi nombre' },
          { value: 'si_solo_interno', label: 'Sí, solo para uso interno del equipo (no público)' },
          { value: 'no', label: 'No autorizo' },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // 2. REQUISITOS DE LA CAMPAÑA — 3 preguntas (filtro de elegibilidad)
  // ────────────────────────────────────────────────────────────────
  {
    id: 'requisitos',
    order: 2,
    eyebrow: 'Lo esencial primero',
    title: 'Requisitos de la campaña',
    description:
      'Estas tres preguntas nos dicen si tu caso corresponde a esta campaña en particular. Aunque tu caso quede fuera de alcance, tus respuestas quedan registradas.',
    fields: [
      {
        id: 'housing_location',
        section: 2,
        type: 'radio',
        label: '¿En qué ciudad está la vivienda afectada?',
        required: true,
        options: [
          { value: 'cali', label: 'Cali' },
          { value: 'pereira', label: 'Pereira' },
          { value: 'otro', label: 'Otro municipio', outOfScope: true },
        ],
      },
      {
        id: 'damage_types',
        section: 2,
        type: 'checkbox-group',
        label: '¿Qué tipo de afectaciones tiene la vivienda?',
        helpText: 'Selecciona todas las que apliquen.',
        required: true,
        minSelected: 1,
        options: [
          // TODO: informe — reemplazar por las 4 categorías reales del informe de la campaña.
          { value: 'grietas_muros_columnas', label: 'Grietas en muros, columnas o vigas' },
          { value: 'techo_cubierta', label: 'Techo o cubierta afectada' },
          { value: 'elementos_no_estructurales', label: 'Puertas, ventanas u otros elementos no estructurales' },
          { value: 'servicios_basicos', label: 'Daño en instalaciones de servicios básicos' },
          { value: 'solo_esteticos', label: 'Solo daños estéticos (pintura, acabados)', outOfScope: true },
          {
            value: 'estructural_severo',
            label: 'Daño estructural severo (orden de demolición o reconstrucción total)',
            outOfScope: true,
          },
        ],
      },
      {
        id: 'insurance_status',
        section: 2,
        type: 'radio',
        label: '¿La vivienda tiene póliza de seguro?',
        required: true,
        options: [
          { value: 'no_tengo', label: 'No tengo póliza de seguro' },
          { value: 'tengo_no_cubre', label: 'Tengo póliza, pero no cubre este tipo de daño' },
          { value: 'tengo_cubriendo', label: 'Tengo póliza y ya está cubriendo el daño', outOfScope: true },
          { value: 'negada_por_escrito', label: 'Solicité la cobertura y me la negaron por escrito' },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // 3. DATOS DE QUIEN SE POSTULA — 9 preguntas
  // ────────────────────────────────────────────────────────────────
  {
    id: 'datos-postulante',
    order: 3,
    eyebrow: 'Sobre ti',
    title: 'Datos de quien se postula',
    fields: [
      {
        id: 'full_name',
        section: 3,
        type: 'text',
        label: 'Nombre completo',
        required: true,
        autoComplete: 'name',
      },
      {
        id: 'document_type',
        section: 3,
        type: 'radio',
        label: 'Tipo de documento',
        required: true,
        options: [
          { value: 'cc', label: 'Cédula de ciudadanía' },
          { value: 'ce', label: 'Cédula de extranjería' },
          { value: 'ppt', label: 'Permiso de Protección Temporal (PPT)' },
          { value: 'ti_rc', label: 'Tarjeta de identidad / Registro civil' },
          { value: 'pasaporte', label: 'Pasaporte' },
          { value: 'otro', label: 'Otro' },
        ],
      },
      {
        id: 'document_number',
        section: 3,
        type: 'text',
        label: 'Número de documento',
        required: true,
        autoComplete: 'off',
      },
      {
        id: 'birth_date',
        section: 3,
        type: 'date',
        label: 'Fecha de nacimiento',
        required: true,
      },
      {
        id: 'phone_primary',
        section: 3,
        type: 'tel',
        label: 'Teléfono principal',
        helpText: 'Debe tener 10 dígitos.',
        exactDigits: 10,
        required: true,
        autoComplete: 'tel',
      },
      {
        id: 'phone_secondary',
        section: 3,
        type: 'tel',
        label: 'Teléfono alterno',
        exactDigits: 10,
        required: false,
      },
      {
        id: 'email',
        section: 3,
        type: 'email',
        label: 'Correo electrónico',
        note: 'Opcional.',
        required: false,
        autoComplete: 'email',
      },
      {
        id: 'relationship_to_housing',
        section: 3,
        type: 'radio',
        label: '¿Cuál es tu relación con la vivienda afectada?',
        required: true,
        options: [
          { value: 'propietario_con_escritura', label: 'Propietario, con escritura' },
          { value: 'propietario_sin_escritura', label: 'Propietario, sin escritura' },
          { value: 'arrendatario', label: 'Arrendatario' },
          { value: 'familiar', label: 'Familiar de quien vive allí' },
          { value: 'otro', label: 'Otro' },
        ],
      },
      {
        id: 'landlord_agreement',
        section: 3,
        type: 'radio',
        label: '¿El propietario está de acuerdo con esta postulación?',
        visibleIf: eq('relationship_to_housing', 'arrendatario'),
        requiredIf: eq('relationship_to_housing', 'arrendatario'),
        options: [
          { value: 'si', label: 'Sí' },
          { value: 'no', label: 'No' },
          { value: 'no_ha_respondido', label: 'No ha respondido' },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // 4. UBICACIÓN — 5 preguntas
  // ────────────────────────────────────────────────────────────────
  {
    id: 'ubicacion',
    order: 4,
    eyebrow: 'Dónde queda',
    title: 'Ubicación de la vivienda',
    fields: [
      {
        id: 'neighborhood',
        section: 4,
        type: 'text',
        label: 'Barrio',
        required: true,
      },
      {
        id: 'exact_address',
        section: 4,
        type: 'text',
        label: 'Dirección exacta',
        required: true,
        autoComplete: 'street-address',
      },
      {
        id: 'reference_point',
        section: 4,
        type: 'textarea',
        label: 'Punto de referencia para llegar',
        helpText:
          'Ej: "frente a la tienda verde, casa esquinera de dos pisos". En zonas afectadas la nomenclatura muchas veces no alcanza para encontrar la casa — esto ayuda mucho al técnico.',
        required: true,
        rows: 2,
      },
      {
        id: 'maps_link',
        section: 4,
        type: 'url',
        label: 'Enlace de Google Maps',
        note: 'Opcional.',
        required: false,
        placeholder: 'https://maps.google.com/...',
      },
      {
        id: 'estrato',
        section: 4,
        type: 'select',
        label: 'Estrato',
        note: 'Es solo informativo, no excluye tu postulación.',
        required: false,
        options: [1, 2, 3, 4, 5, 6].map((n) => ({ value: String(n), label: `Estrato ${n}` })),
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // 5. EL HOGAR — 8 preguntas
  // ────────────────────────────────────────────────────────────────
  {
    id: 'hogar',
    order: 5,
    eyebrow: 'Quiénes viven ahí',
    title: 'El hogar',
    fields: [
      {
        id: 'household_size',
        section: 5,
        type: 'number',
        label: '¿Cuántas personas viven en el hogar?',
        required: true,
        min: 1,
        max: 30,
      },
      {
        id: 'household_minors',
        section: 5,
        type: 'number',
        label: '¿Cuántas de esas personas son menores de 18 años?',
        required: true,
        min: 0,
        max: 30,
      },
      {
        id: 'household_elderly',
        section: 5,
        type: 'number',
        label: '¿Cuántas son mayores de 65 años?',
        required: true,
        min: 0,
        max: 30,
      },
      {
        id: 'vulnerability_situations',
        section: 5,
        type: 'checkbox-group',
        label: '¿Alguien en el hogar está en alguna de estas situaciones?',
        sensitive: true,
        note: 'Esta pregunta es opcional. No estás obligado a responderla.',
        required: false,
        options: [
          { value: 'discapacidad', label: 'Discapacidad' },
          { value: 'enfermedad_cronica', label: 'Enfermedad crónica' },
          { value: 'embarazo', label: 'Embarazo' },
          { value: 'unico_proveedor', label: 'Único proveedor del hogar' },
          { value: 'desplazamiento', label: 'Situación de desplazamiento' },
          { value: 'ninguna', label: 'Ninguna de las anteriores' },
        ],
      },
      {
        id: 'lost_income_earthquake',
        section: 5,
        type: 'radio',
        label: '¿Alguien en el hogar perdió su ingreso por el terremoto?',
        required: true,
        options: [
          { value: 'si', label: 'Sí' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'monthly_income_range',
        section: 5,
        type: 'select',
        label: 'Rango de ingreso mensual del hogar',
        required: true,
        options: [
          { value: 'menos_1_slmv', label: 'Menos de 1 salario mínimo' },
          { value: '1_2_slmv', label: 'Entre 1 y 2 salarios mínimos' },
          { value: '2_4_slmv', label: 'Entre 2 y 4 salarios mínimos' },
          { value: 'mas_4_slmv', label: 'Más de 4 salarios mínimos' },
          { value: 'prefiero_no_decir', label: 'Prefiero no decir' },
        ],
      },
      {
        id: 'has_pets',
        section: 5,
        type: 'radio',
        label: '¿Tienen mascotas en el hogar?',
        required: true,
        options: [
          { value: 'si', label: 'Sí' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'pets_affected_detail',
        section: 5,
        type: 'textarea',
        label: '¿Las mascotas resultaron afectadas por el terremoto? Contanos brevemente.',
        helpText: 'Esto nos ayuda a conectar tu caso con nuestro aliado veterinario si aplica.',
        visibleIf: eq('has_pets', 'si'),
        required: false,
        rows: 2,
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // 6. ESTADO DE LA VIVIENDA Y DAÑOS — 15 preguntas
  // ────────────────────────────────────────────────────────────────
  {
    id: 'vivienda-danos',
    order: 6,
    eyebrow: 'La sección más larga',
    title: 'Estado de la vivienda y daños',
    description: 'Esta parte lleva más preguntas porque es la que más usa el equipo técnico para evaluar tu caso.',
    fields: [
      {
        id: 'housing_type',
        section: 6,
        type: 'radio',
        label: 'Tipo de vivienda',
        required: true,
        options: [
          { value: 'casa', label: 'Casa' },
          { value: 'apartamento', label: 'Apartamento' },
          { value: 'cuarto_arrendado', label: 'Cuarto o habitación arrendada' },
          { value: 'otro', label: 'Otro' },
        ],
      },
      {
        id: 'is_permanent_residence',
        section: 6,
        type: 'radio',
        label: '¿Es tu residencia permanente?',
        required: true,
        options: [
          { value: 'si', label: 'Sí' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'can_inhabit_today',
        section: 6,
        type: 'radio',
        label: '¿Puedes habitar la vivienda hoy?',
        required: true,
        options: [
          { value: 'si', label: 'Sí, sin problema' },
          { value: 'parcialmente', label: 'Parcialmente' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'current_sleeping_place',
        section: 6,
        type: 'text',
        label: 'Si tuviste que salir, ¿dónde estás durmiendo actualmente?',
        visibleIf: not(eq('can_inhabit_today', 'si')),
        requiredIf: not(eq('can_inhabit_today', 'si')),
      },
      {
        id: 'affected_parts',
        section: 6,
        type: 'checkbox-group',
        label: '¿Qué partes de la vivienda se afectaron?',
        helpText: 'Selecciona todas las que apliquen.',
        required: true,
        minSelected: 1,
        options: [
          { value: 'techo', label: 'Techo / cubierta' },
          { value: 'muros_exteriores', label: 'Muros exteriores' },
          { value: 'muros_interiores', label: 'Muros interiores' },
          { value: 'columnas_vigas', label: 'Columnas o vigas' },
          { value: 'piso', label: 'Piso / cimentación' },
          { value: 'puertas_ventanas', label: 'Puertas o ventanas' },
          { value: 'escaleras', label: 'Escaleras' },
          { value: 'cocina', label: 'Cocina' },
          { value: 'baño', label: 'Baño' },
          { value: 'instalacion_electrica', label: 'Instalación eléctrica' },
          { value: 'instalacion_hidraulica', label: 'Instalación hidráulica / sanitaria' },
          { value: 'fachada', label: 'Fachada' },
          { value: 'otro', label: 'Otro' },
        ],
      },
      {
        id: 'services_not_working',
        section: 6,
        type: 'checkbox-group',
        label: '¿Qué servicios no están funcionando actualmente?',
        required: true,
        options: [
          { value: 'agua', label: 'Agua' },
          { value: 'luz', label: 'Energía eléctrica' },
          { value: 'gas', label: 'Gas' },
          { value: 'alcantarillado', label: 'Alcantarillado' },
          { value: 'ninguno', label: 'Todos funcionan con normalidad' },
        ],
      },
      {
        id: 'authority_reviewed',
        section: 6,
        type: 'radio',
        label: '¿Alguna autoridad revisó la vivienda?',
        required: true,
        options: [
          { value: 'si', label: 'Sí' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'authority_concept',
        section: 6,
        type: 'select',
        label: '¿Con qué concepto?',
        visibleIf: eq('authority_reviewed', 'si'),
        requiredIf: eq('authority_reviewed', 'si'),
        options: [
          { value: 'habitable', label: 'Habitable' },
          { value: 'habitable_con_condiciones', label: 'Habitable con condiciones' },
          { value: 'no_habitable', label: 'No habitable / riesgo de colapso' },
          { value: 'pendiente', label: 'Pendiente de concepto' },
        ],
      },
      {
        id: 'authority_concept_document',
        section: 6,
        type: 'file',
        label: 'Si tienes el documento de ese concepto, puedes adjuntarlo aquí',
        accept: '.pdf,.jpg,.jpeg,.png',
        maxFiles: 1,
        maxSizeMB: 15,
        visibleIf: eq('authority_reviewed', 'si'),
        required: false,
      },
      {
        id: 'damage_free_description',
        section: 6,
        type: 'textarea',
        label: 'Describe con tus palabras los daños de la vivienda',
        required: true,
        rows: 4,
      },
      {
        id: 'single_fix_needed',
        section: 6,
        type: 'textarea',
        label: 'Si solo pudieras arreglar una cosa para volver a vivir tranquilo ahí, ¿cuál sería?',
        required: true,
        rows: 2,
      },
      {
        id: 'photos',
        section: 6,
        type: 'file',
        label: 'Fotos de los daños',
        helpText: 'Hasta 10 fotos. Las comprimimos automáticamente antes de enviarlas para que pesen menos.',
        accept: 'image/*',
        multiple: true,
        maxFiles: 10,
        maxSizeMB: 15,
        compressImages: true,
        required: false,
      },
      {
        id: 'videos',
        section: 6,
        type: 'file',
        label: 'Videos de los daños',
        helpText: 'Hasta 2 videos, máximo 100 MB cada uno.',
        accept: 'video/*',
        multiple: true,
        maxFiles: 2,
        maxSizeMB: 100,
        required: false,
      },
      {
        id: 'external_media_link',
        section: 6,
        type: 'url',
        label: 'O, si prefieres, pega aquí un enlace (Drive, YouTube o WeTransfer)',
        required: false,
        placeholder: 'https://',
      },
      {
        id: 'media_delivery_channel',
        section: 6,
        type: 'radio',
        label: '¿Por cuál vía enviaste las fotos o videos?',
        helpText: 'Esto nos ayuda a saber dónde buscar tu material.',
        required: true,
        options: [
          { value: 'subido_aqui', label: 'Los subí aquí (fotos y/o videos)' },
          { value: 'enlace', label: 'Pegué un enlace' },
          { value: 'whatsapp', label: 'Los envié por WhatsApp' },
          { value: 'aun_no', label: 'Todavía no los he enviado' },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // 7. SEGUROS Y OTRAS AYUDAS — 7 preguntas
  // ────────────────────────────────────────────────────────────────
  {
    id: 'seguros-ayudas',
    order: 7,
    eyebrow: 'Para no duplicar esfuerzos',
    title: 'Seguros y otras ayudas',
    description:
      'Esta sección es clave: nos permite enfocar los recursos en familias que no tienen otra fuente de recuperación.',
    fields: [
      {
        id: 'has_mortgage_or_leasing',
        section: 7,
        type: 'radio',
        label: '¿Tienes crédito hipotecario o leasing sobre la vivienda?',
        required: true,
        options: [
          { value: 'si', label: 'Sí' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'insurer_or_bank_name',
        section: 7,
        type: 'text',
        label: 'Nombre de la aseguradora o del banco',
        visibleIf: (v) =>
          v.has_mortgage_or_leasing === 'si' || (typeof v.insurance_status === 'string' && v.insurance_status !== 'no_tengo'),
        requiredIf: (v) =>
          v.has_mortgage_or_leasing === 'si' || (typeof v.insurance_status === 'string' && v.insurance_status !== 'no_tengo'),
      },
      {
        id: 'claim_reported',
        section: 7,
        type: 'radio',
        label: '¿Ya reportaste el siniestro a la aseguradora?',
        visibleIf: (v) => typeof v.insurance_status === 'string' && v.insurance_status !== 'no_tengo',
        requiredIf: (v) => typeof v.insurance_status === 'string' && v.insurance_status !== 'no_tengo',
        options: [
          { value: 'si', label: 'Sí' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'denial_reason',
        section: 7,
        type: 'textarea',
        label: '¿Por qué te negaron la cobertura?',
        visibleIf: eq('insurance_status', 'negada_por_escrito'),
        required: false,
        rows: 2,
      },
      {
        id: 'other_aid_received',
        section: 7,
        type: 'checkbox-group',
        label: '¿Has recibido ayuda de alguna de estas fuentes?',
        required: true,
        minSelected: 1,
        options: [
          { value: 'alcaldia', label: 'Alcaldía municipal' },
          { value: 'gestion_riesgo', label: 'Unidad de Gestión del Riesgo' },
          { value: 'arriendo_temporal', label: 'Arriendo temporal de algún programa' },
          { value: 'otra_ong', label: 'Otra ONG o fundación' },
          { value: 'empleador', label: 'Empleador' },
          { value: 'comunidad_familia', label: 'Familia o comunidad' },
          { value: 'iglesia', label: 'Iglesia o comunidad religiosa' },
          { value: 'ninguna', label: 'Ninguna' },
        ],
      },
      {
        id: 'other_aid_detail',
        section: 7,
        type: 'textarea',
        label: '¿En qué consistió esa ayuda?',
        visibleIf: (v) => {
          const list = v.other_aid_received;
          return Array.isArray(list) && list.length > 0 && !(list.length === 1 && list[0] === 'ninguna');
        },
        required: false,
        rows: 2,
      },
      {
        id: 'received_sos_aid_before',
        section: 7,
        type: 'radio',
        label: '¿Ya recibiste algo de esta campaña anteriormente?',
        required: true,
        options: [
          { value: 'si', label: 'Sí' },
          { value: 'no', label: 'No' },
        ],
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // 8. SU HISTORIA — 4 preguntas
  // ────────────────────────────────────────────────────────────────
  {
    id: 'historia',
    order: 8,
    eyebrow: 'En tus palabras',
    title: 'Tu historia',
    fields: [
      {
        id: 'what_happened_aug10',
        section: 8,
        type: 'textarea',
        label: '¿Qué pasó el 10 de agosto y cómo afectó a tu familia?',
        required: true,
        rows: 5,
      },
      {
        id: 'time_living_there',
        section: 8,
        type: 'text',
        label: '¿Cuánto tiempo llevas viviendo ahí?',
        required: true,
        placeholder: 'Ej: 3 años',
      },
      {
        id: 'can_contribute_labor_or_material',
        section: 8,
        type: 'radio',
        label: '¿Tu familia puede aportar mano de obra o material para la reparación?',
        required: true,
        options: [
          { value: 'si', label: 'Sí' },
          { value: 'parcialmente', label: 'Parcialmente' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'open_final_field',
        section: 8,
        type: 'textarea',
        label: '¿Algo más que quieras contarnos?',
        required: false,
        rows: 3,
      },
    ],
  },

  // ────────────────────────────────────────────────────────────────
  // 9. VISITA Y CIERRE — 5 preguntas
  // ────────────────────────────────────────────────────────────────
  {
    id: 'visita-cierre',
    order: 9,
    eyebrow: 'Últimos pasos',
    title: 'Visita y cierre',
    fields: [
      {
        id: 'authorize_technician_visit',
        section: 9,
        type: 'radio',
        label: '¿Autorizas la visita de un técnico a la vivienda?',
        required: true,
        options: [
          { value: 'si', label: 'Sí' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'visit_availability',
        section: 9,
        type: 'checkbox-group',
        label: '¿Qué días y horarios tienes disponibilidad?',
        required: true,
        minSelected: 1,
        options: [
          { value: 'lunes_viernes_am', label: 'Lunes a viernes en la mañana' },
          { value: 'lunes_viernes_pm', label: 'Lunes a viernes en la tarde' },
          { value: 'sabado', label: 'Sábado' },
          { value: 'domingo', label: 'Domingo' },
        ],
      },
      {
        id: 'has_bank_account_or_nequi',
        section: 9,
        type: 'radio',
        label: '¿Tienes cuenta bancaria o Nequi a tu nombre?',
        helpText: 'No te vamos a pedir el número aquí — solo si existe, para coordinarlo en la visita.',
        required: true,
        options: [
          { value: 'si', label: 'Sí' },
          { value: 'no', label: 'No' },
        ],
      },
      {
        id: 'how_did_you_hear',
        section: 9,
        type: 'select',
        label: '¿Cómo te enteraste de esta campaña?',
        required: true,
        options: [
          { value: 'redes_sociales', label: 'Redes sociales' },
          { value: 'un_donante', label: 'Un donante' },
          { value: 'comunidad_vecinos', label: 'La comunidad o vecinos' },
          { value: 'medios_comunicacion', label: 'Medios de comunicación' },
          { value: 'otro', label: 'Otro' },
        ],
      },
      {
        id: 'referring_donor_name',
        section: 9,
        type: 'text',
        label: '¿Cuál es el nombre del donante que te recomendó la campaña?',
        visibleIf: eq('how_did_you_hear', 'un_donante'),
        required: false,
      },
    ],
  },
];

export const allFields = sections.flatMap((s) => s.fields);
export const totalSections = sections.length;
