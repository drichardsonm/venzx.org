export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      apoyos_propuestas: {
        Row: {
          id_apoyo: number
          id_propuesta: number
          id_usuario: number
          voto_tipo: string
        }
        Insert: {
          id_apoyo?: number
          id_propuesta: number
          id_usuario: number
          voto_tipo: string
        }
        Update: {
          id_apoyo?: number
          id_propuesta?: number
          id_usuario?: number
          voto_tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "apoyos_propuestas_id_propuesta_fkey"
            columns: ["id_propuesta"]
            isOneToOne: false
            referencedRelation: "propuestas"
            referencedColumns: ["id_propuesta"]
          },
          {
            foreignKeyName: "apoyos_propuestas_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id_correlativo"]
          },
        ]
      }
      propuesta_actividad: {
        Row: {
          cambio_apoyos: number
          fecha_interaccion: string | null
          id: number
          id_propuesta: number
          id_usuario: number
          voto_tipo: string
        }
        Insert: {
          cambio_apoyos: number
          fecha_interaccion?: string | null
          id?: never
          id_propuesta: number
          id_usuario: number
          voto_tipo: string
        }
        Update: {
          cambio_apoyos?: number
          fecha_interaccion?: string | null
          id?: never
          id_propuesta?: number
          id_usuario?: number
          voto_tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "propuesta_actividad_id_propuesta_fkey"
            columns: ["id_propuesta"]
            isOneToOne: false
            referencedRelation: "propuestas"
            referencedColumns: ["id_propuesta"]
          },
          {
            foreignKeyName: "propuesta_actividad_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id_correlativo"]
          },
        ]
      }
      propuestas: {
        Row: {
          categoria: string
          contenido: string
          estado_propuesta: string
          fecha_creacion: string
          id_propuesta: number
          id_usuario: number
          tipo_intencion: string
        }
        Insert: {
          categoria?: string
          contenido: string
          estado_propuesta?: string
          fecha_creacion?: string
          id_propuesta?: number
          id_usuario: number
          tipo_intencion: string
        }
        Update: {
          categoria?: string
          contenido?: string
          estado_propuesta?: string
          fecha_creacion?: string
          id_propuesta?: number
          id_usuario?: number
          tipo_intencion?: string
        }
        Relationships: [
          {
            foreignKeyName: "propuestas_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id_correlativo"]
          },
        ]
      }
      usuarios: {
        Row: {
          edad_rango: string | null
          estado: string | null
          fecha_registro: string
          genero: string | null
          id_correlativo: number
          intereses: string[]
          municipio: string | null
          parroquia: string | null
          secreto_hash: string
        }
        Insert: {
          edad_rango?: string | null
          estado?: string | null
          fecha_registro?: string
          genero?: string | null
          id_correlativo?: number
          intereses?: string[]
          municipio?: string | null
          parroquia?: string | null
          secreto_hash: string
        }
        Update: {
          edad_rango?: string | null
          estado?: string | null
          fecha_registro?: string
          genero?: string | null
          id_correlativo?: number
          intereses?: string[]
          municipio?: string | null
          parroquia?: string | null
          secreto_hash?: string
        }
        Relationships: []
      }
      votaciones_convocadas: {
        Row: {
          activa: boolean
          alcance_geografico: string
          descripcion: string | null
          estado_restriccion: string | null
          fecha_fin: string
          fecha_inicio: string
          id_votacion: number
          municipio_restriccion: string | null
          titulo: string
        }
        Insert: {
          activa?: boolean
          alcance_geografico?: string
          descripcion?: string | null
          estado_restriccion?: string | null
          fecha_fin: string
          fecha_inicio?: string
          id_votacion?: number
          municipio_restriccion?: string | null
          titulo: string
        }
        Update: {
          activa?: boolean
          alcance_geografico?: string
          descripcion?: string | null
          estado_restriccion?: string | null
          fecha_fin?: string
          fecha_inicio?: string
          id_votacion?: number
          municipio_restriccion?: string | null
          titulo?: string
        }
        Relationships: []
      }
      votos_finales: {
        Row: {
          id_usuario: number
          id_votacion: number
          id_voto: number
          opcion_seleccionada: string
        }
        Insert: {
          id_usuario: number
          id_votacion: number
          id_voto?: number
          opcion_seleccionada: string
        }
        Update: {
          id_usuario?: number
          id_votacion?: number
          id_voto?: number
          opcion_seleccionada?: string
        }
        Relationships: [
          {
            foreignKeyName: "votos_finales_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id_correlativo"]
          },
          {
            foreignKeyName: "votos_finales_id_votacion_fkey"
            columns: ["id_votacion"]
            isOneToOne: false
            referencedRelation: "votaciones_convocadas"
            referencedColumns: ["id_votacion"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
