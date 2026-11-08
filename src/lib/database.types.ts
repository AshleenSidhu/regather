
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "audit_log": {
                  Row: {
                    "action": string,"actor_id": string | null,"created_at": string,"id": number,"partner_id": string,"target_id": string | null,"target_type": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"actor_id"?: string | null,"created_at"?: string,"id"?: never,"partner_id": string,"target_id"?: string | null,"target_type"?: string | null
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"created_at"?: string,"id"?: never,"partner_id"?: string,"target_id"?: string | null,"target_type"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_log_partner_id_fkey"
      columns: ["partner_id"]
isOneToOne: false
      referencedRelation: "partners"
      referencedColumns: ["id"]
    }
                  ]
                },"circle_members": {
                  Row: {
                    "circle_id": string,"joined_at": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "circle_id": string,"joined_at"?: string,"user_id": string
                  }
                  Update: {
                    "circle_id"?: string,"joined_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "circle_members_circle_id_fkey"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "circle_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"circles": {
                  Row: {
                    "age_band": Database["public"]['Enums']["age_band"] | null,"audience": Database["public"]['Enums']["audience"],"cohort_start": string,"created_at": string,"id": string,"kind": Database["public"]['Enums']["circle_kind"],"max_members": number,"mentor_id": string | null,"name": string,"partner_id": string,"stage": Database["public"]['Enums']["stage"] | null,"tags": (Database["public"]['Enums']["situation_tag"])[],"times": (Database["public"]['Enums']["time_of_day"])[]
                  }
                  ComputedFields: never
                  Insert: {
                    "age_band"?: Database["public"]['Enums']["age_band"] | null,"audience": Database["public"]['Enums']["audience"],"cohort_start"?: string,"created_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["circle_kind"],"max_members"?: number,"mentor_id"?: string | null,"name": string,"partner_id": string,"stage"?: Database["public"]['Enums']["stage"] | null,"tags"?: (Database["public"]['Enums']["situation_tag"])[],"times"?: (Database["public"]['Enums']["time_of_day"])[]
                  }
                  Update: {
                    "age_band"?: Database["public"]['Enums']["age_band"] | null,"audience"?: Database["public"]['Enums']["audience"],"cohort_start"?: string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["circle_kind"],"max_members"?: number,"mentor_id"?: string | null,"name"?: string,"partner_id"?: string,"stage"?: Database["public"]['Enums']["stage"] | null,"tags"?: (Database["public"]['Enums']["situation_tag"])[],"times"?: (Database["public"]['Enums']["time_of_day"])[]
                  }
                  Relationships: [
                    {
      foreignKeyName: "circles_mentor_id_fkey"
      columns: ["mentor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "circles_partner_id_fkey"
      columns: ["partner_id"]
isOneToOne: false
      referencedRelation: "partners"
      referencedColumns: ["id"]
    }
                  ]
                },"comfort_notes": {
                  Row: {
                    "body": string,"color": string,"created_at": string,"id": string,"kind": string,"recipient_id": string,"redacted": boolean,"saved_to_jar": boolean,"sender_id": string,"sticker": Database["public"]['Enums']["note_sticker"]
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"color"?: string,"created_at"?: string,"id"?: string,"kind"?: string,"recipient_id": string,"redacted"?: boolean,"saved_to_jar"?: boolean,"sender_id": string,"sticker"?: Database["public"]['Enums']["note_sticker"]
                  }
                  Update: {
                    "body"?: string,"color"?: string,"created_at"?: string,"id"?: string,"kind"?: string,"recipient_id"?: string,"redacted"?: boolean,"saved_to_jar"?: boolean,"sender_id"?: string,"sticker"?: Database["public"]['Enums']["note_sticker"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "comfort_notes_recipient_id_fkey"
      columns: ["recipient_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "comfort_notes_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"connections": {
                  Row: {
                    "addressee_id": string,"created_at": string,"id": string,"requester_id": string,"status": Database["public"]['Enums']["request_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "addressee_id": string,"created_at"?: string,"id"?: string,"requester_id": string,"status"?: Database["public"]['Enums']["request_status"]
                  }
                  Update: {
                    "addressee_id"?: string,"created_at"?: string,"id"?: string,"requester_id"?: string,"status"?: Database["public"]['Enums']["request_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "connections_addressee_id_fkey"
      columns: ["addressee_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "connections_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"flags": {
                  Row: {
                    "context": string,"created_at": string,"id": string,"message_id": string | null,"note_id": string | null,"partner_id": string,"review_note": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"sender_id": string | null,"severity": Database["public"]['Enums']["flag_severity"],"snapshot": string | null,"source": Database["public"]['Enums']["flag_source"],"status": Database["public"]['Enums']["flag_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "context": string,"created_at"?: string,"id"?: string,"message_id"?: string | null,"note_id"?: string | null,"partner_id": string,"review_note"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"sender_id"?: string | null,"severity": Database["public"]['Enums']["flag_severity"],"snapshot"?: string | null,"source": Database["public"]['Enums']["flag_source"],"status"?: Database["public"]['Enums']["flag_status"]
                  }
                  Update: {
                    "context"?: string,"created_at"?: string,"id"?: string,"message_id"?: string | null,"note_id"?: string | null,"partner_id"?: string,"review_note"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"sender_id"?: string | null,"severity"?: Database["public"]['Enums']["flag_severity"],"snapshot"?: string | null,"source"?: Database["public"]['Enums']["flag_source"],"status"?: Database["public"]['Enums']["flag_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "flags_message_id_fkey"
      columns: ["message_id"]
isOneToOne: false
      referencedRelation: "messages"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "flags_note_id_fkey"
      columns: ["note_id"]
isOneToOne: false
      referencedRelation: "comfort_notes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "flags_partner_id_fkey"
      columns: ["partner_id"]
isOneToOne: false
      referencedRelation: "partners"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "flags_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"invite_codes": {
                  Row: {
                    "age_band": Database["public"]['Enums']["age_band"],"code_hash": string,"created_at": string,"created_by": string | null,"expires_at": string,"id": string,"label": string | null,"max_uses": number,"partner_id": string,"revoked_at": string | null,"role": Database["public"]['Enums']["app_role"],"uses": number
                  }
                  ComputedFields: never
                  Insert: {
                    "age_band": Database["public"]['Enums']["age_band"],"code_hash": string,"created_at"?: string,"created_by"?: string | null,"expires_at": string,"id"?: string,"label"?: string | null,"max_uses"?: number,"partner_id": string,"revoked_at"?: string | null,"role": Database["public"]['Enums']["app_role"],"uses"?: number
                  }
                  Update: {
                    "age_band"?: Database["public"]['Enums']["age_band"],"code_hash"?: string,"created_at"?: string,"created_by"?: string | null,"expires_at"?: string,"id"?: string,"label"?: string | null,"max_uses"?: number,"partner_id"?: string,"revoked_at"?: string | null,"role"?: Database["public"]['Enums']["app_role"],"uses"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "invite_codes_partner_id_fkey"
      columns: ["partner_id"]
isOneToOne: false
      referencedRelation: "partners"
      referencedColumns: ["id"]
    }
                  ]
                },"mentor_requests": {
                  Row: {
                    "circle_id": string,"created_at": string,"id": string,"mentor_id": string,"requester_id": string,"status": Database["public"]['Enums']["request_status"]
                  }
                  ComputedFields: never
                  Insert: {
                    "circle_id": string,"created_at"?: string,"id"?: string,"mentor_id": string,"requester_id": string,"status"?: Database["public"]['Enums']["request_status"]
                  }
                  Update: {
                    "circle_id"?: string,"created_at"?: string,"id"?: string,"mentor_id"?: string,"requester_id"?: string,"status"?: Database["public"]['Enums']["request_status"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "mentor_requests_circle_id_fkey"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mentor_requests_mentor_id_fkey"
      columns: ["mentor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "mentor_requests_requester_id_fkey"
      columns: ["requester_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "body": string,"checkin_score": number | null,"circle_id": string | null,"created_at": string,"id": string,"kind": Database["public"]['Enums']["message_kind"],"redacted": boolean,"sender_id": string,"thread_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body": string,"checkin_score"?: number | null,"circle_id"?: string | null,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["message_kind"],"redacted"?: boolean,"sender_id": string,"thread_id"?: string | null
                  }
                  Update: {
                    "body"?: string,"checkin_score"?: number | null,"circle_id"?: string | null,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["message_kind"],"redacted"?: boolean,"sender_id"?: string,"thread_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_circle_id_fkey"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_sender_id_fkey"
      columns: ["sender_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "messages_thread_id_fkey"
      columns: ["thread_id"]
isOneToOne: false
      referencedRelation: "threads"
      referencedColumns: ["id"]
    }
                  ]
                },"partner_staff": {
                  Row: {
                    "created_at": string,"is_moderator": boolean,"partner_id": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"is_moderator"?: boolean,"partner_id": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"is_moderator"?: boolean,"partner_id"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "partner_staff_partner_id_fkey"
      columns: ["partner_id"]
isOneToOne: false
      referencedRelation: "partners"
      referencedColumns: ["id"]
    }
                  ]
                },"partners": {
                  Row: {
                    "created_at": string,"id": string,"kind": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"kind": string,"name": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"kind"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profile_details": {
                  Row: {
                    "age_band": Database["public"]['Enums']["age_band"],"child_age_band": Database["public"]['Enums']["child_age_band"] | null,"city": string | null,"created_at": string,"invite_id": string | null,"language": string,"norms_accepted_at": string | null,"onboarded_at": string | null,"partner_id": string,"situation_tags": (Database["public"]['Enums']["situation_tag"])[],"stage": Database["public"]['Enums']["stage"] | null,"times_of_day": (Database["public"]['Enums']["time_of_day"])[],"trust_level": number,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "age_band": Database["public"]['Enums']["age_band"],"child_age_band"?: Database["public"]['Enums']["child_age_band"] | null,"city"?: string | null,"created_at"?: string,"invite_id"?: string | null,"language"?: string,"norms_accepted_at"?: string | null,"onboarded_at"?: string | null,"partner_id": string,"situation_tags"?: (Database["public"]['Enums']["situation_tag"])[],"stage"?: Database["public"]['Enums']["stage"] | null,"times_of_day"?: (Database["public"]['Enums']["time_of_day"])[],"trust_level"?: number,"user_id": string
                  }
                  Update: {
                    "age_band"?: Database["public"]['Enums']["age_band"],"child_age_band"?: Database["public"]['Enums']["child_age_band"] | null,"city"?: string | null,"created_at"?: string,"invite_id"?: string | null,"language"?: string,"norms_accepted_at"?: string | null,"onboarded_at"?: string | null,"partner_id"?: string,"situation_tags"?: (Database["public"]['Enums']["situation_tag"])[],"stage"?: Database["public"]['Enums']["stage"] | null,"times_of_day"?: (Database["public"]['Enums']["time_of_day"])[],"trust_level"?: number,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "profile_details_invite_id_fkey"
      columns: ["invite_id"]
isOneToOne: false
      referencedRelation: "invite_codes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profile_details_invite_id_fkey"
      columns: ["invite_id"]
isOneToOne: false
      referencedRelation: "partner_codes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profile_details_partner_id_fkey"
      columns: ["partner_id"]
isOneToOne: false
      referencedRelation: "partners"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "profile_details_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "audience": Database["public"]['Enums']["audience"],"created_at": string,"id": string,"nickname": string,"role": Database["public"]['Enums']["app_role"],"sticker": Database["public"]['Enums']["note_sticker"]
                  }
                  ComputedFields: never
                  Insert: {
                    "audience": Database["public"]['Enums']["audience"],"created_at"?: string,"id": string,"nickname": string,"role": Database["public"]['Enums']["app_role"],"sticker"?: Database["public"]['Enums']["note_sticker"]
                  }
                  Update: {
                    "audience"?: Database["public"]['Enums']["audience"],"created_at"?: string,"id"?: string,"nickname"?: string,"role"?: Database["public"]['Enums']["app_role"],"sticker"?: Database["public"]['Enums']["note_sticker"]
                  }
                  Relationships: [
                    
                  ]
                },"threads": {
                  Row: {
                    "circle_id": string | null,"created_at": string,"id": string,"kind": Database["public"]['Enums']["thread_kind"],"user_a": string,"user_b": string
                  }
                  ComputedFields: never
                  Insert: {
                    "circle_id"?: string | null,"created_at"?: string,"id"?: string,"kind": Database["public"]['Enums']["thread_kind"],"user_a": string,"user_b": string
                  }
                  Update: {
                    "circle_id"?: string | null,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["thread_kind"],"user_a"?: string,"user_b"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "threads_circle_id_fkey"
      columns: ["circle_id"]
isOneToOne: false
      referencedRelation: "circles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "threads_user_a_fkey"
      columns: ["user_a"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "threads_user_b_fkey"
      columns: ["user_b"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            "partner_codes": {
                  Row: {
                    "age_band": Database["public"]['Enums']["age_band"],"created_at": string,"expires_at": string,"id": string,"label": string | null,"max_uses": number,"partner_id": string,"revoked_at": string | null,"role": Database["public"]['Enums']["app_role"],"uses": number
                  }
                  ComputedFields: never
                  Insert: {
                           "age_band"?: Database["public"]['Enums']["age_band"] | null,"created_at"?: string | null,"expires_at"?: string | null,"id"?: string | null,"label"?: string | null,"max_uses"?: number | null,"partner_id"?: string | null,"revoked_at"?: string | null,"role"?: Database["public"]['Enums']["app_role"] | null,"uses"?: number | null
                         }
                        Update: {
                           "age_band"?: Database["public"]['Enums']["age_band"] | null,"created_at"?: string | null,"expires_at"?: string | null,"id"?: string | null,"label"?: string | null,"max_uses"?: number | null,"partner_id"?: string | null,"revoked_at"?: string | null,"role"?: Database["public"]['Enums']["app_role"] | null,"uses"?: number | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "invite_codes_partner_id_fkey"
      columns: ["partner_id"]
isOneToOne: false
      referencedRelation: "partners"
      referencedColumns: ["id"]
    }
                  ]
                },"partner_flag_queue": {
                  Row: {
                    "context": string,"created_at": string,"id": string,"partner_id": string,"review_note": string | null,"reviewed_at": string | null,"sender_nickname": string | null,"severity": Database["public"]['Enums']["flag_severity"],"snapshot": string | null,"source": Database["public"]['Enums']["flag_source"],"status": Database["public"]['Enums']["flag_status"]
                  }
                  ComputedFields: never
                  Relationships: [
                    {
      foreignKeyName: "flags_partner_id_fkey"
      columns: ["partner_id"]
isOneToOne: false
      referencedRelation: "partners"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Functions: {
            "add_ai_flag":
{ Args: { "p_message_id": string,"p_severity": Database["public"]['Enums']["flag_severity"] }; Returns: string
                           },
"add_ai_note_flag":
{ Args: { "p_note_id": string,"p_severity": Database["public"]['Enums']["flag_severity"] }; Returns: string
                           },
"complete_onboarding":
{ Args: { "p_child_age": Database["public"]['Enums']["child_age_band"],"p_city": string,"p_language": string,"p_norms": boolean,"p_stage": Database["public"]['Enums']["stage"],"p_tags": (Database["public"]['Enums']["situation_tag"])[],"p_times": (Database["public"]['Enums']["time_of_day"])[] }; Returns: Json
                           },
"create_invite_code":
{ Args: { "p_age_band": Database["public"]['Enums']["age_band"],"p_label": string,"p_max_uses": number,"p_role": Database["public"]['Enums']["app_role"],"p_ttl_days": number }; Returns: Json
                           },
"export_my_data":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"invite_is_redeemable":
{ Args: { "p_code": string }; Returns: boolean
                           },
"join_best_circle":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"moderator_read_thread":
{ Args: { "p_thread_id": string }; Returns: Json
                           },
"partner_circle_activity":
{ Args: Record<PropertyKey, never>; Returns: {
              "circle_id": string,"circle_name": string,"kind": Database["public"]['Enums']["circle_kind"],"last_message_at": string,"members": number,"mentor_nickname": string,"messages_24h": number
            }[]
                           },
"redeem_invite":
{ Args: { "p_code": string,"p_nickname": string,"p_user_id": string }; Returns: Json
                           },
"request_connection":
{ Args: { "p_other": string }; Returns: Json
                           },
"request_mentor":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"respond_connection":
{ Args: { "p_accept": boolean,"p_id": string }; Returns: Json
                           },
"respond_mentor_request":
{ Args: { "p_accept": boolean,"p_id": string }; Returns: Json
                           },
"review_flag":
{ Args: { "p_id": string,"p_note": string,"p_status": Database["public"]['Enums']["flag_status"] }; Returns: Json
                           },
"revoke_invite_code":
{ Args: { "p_id": string }; Returns: Json
                           },
"rl_hit":
{ Args: { "p_bucket": string,"p_max": number,"p_window_seconds": number }; Returns: boolean
                           },
"send_message":
{ Args: { "p_body": string,"p_circle_id": string,"p_kind"?: Database["public"]['Enums']["message_kind"],"p_score"?: number,"p_thread_id": string }; Returns: Json
                           },
"send_note":
{ Args: { "p_body": string,"p_color": string,"p_recipient": string,"p_sticker": Database["public"]['Enums']["note_sticker"] }; Returns: Json
                           },
"trigger_sos":
{ Args: Record<PropertyKey, never>; Returns: Json
                           }
          }
          Enums: {
            "age_band": "13_15"|"16_17"|"18_24"|"25_plus","app_role": "parent"|"youth"|"young_adult"|"mentor"|"partner","audience": "minor"|"adult","child_age_band": "under_13"|"13_15"|"16_17"|"18_plus","circle_kind": "parent"|"youth"|"young_adult","flag_severity": "medium"|"high","flag_source": "keyword"|"ai"|"sos","flag_status": "open"|"reviewing"|"resolved","message_kind": "text"|"checkin","note_sticker": "shell"|"lily"|"axolotl","request_status": "requested"|"accepted"|"declined","situation_tag": "er_discharge"|"anxiety"|"depression"|"self_harm"|"eating_concerns"|"substance_use"|"school_stress"|"bullying"|"grief"|"family_conflict","stage": "just_after_crisis"|"newly_diagnosed"|"long_term","thread_kind": "mentor"|"private","time_of_day": "morning"|"afternoon"|"evening"|"night"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "age_band": ["13_15", "16_17", "18_24", "25_plus"],"app_role": ["parent", "youth", "young_adult", "mentor", "partner"],"audience": ["minor", "adult"],"child_age_band": ["under_13", "13_15", "16_17", "18_plus"],"circle_kind": ["parent", "youth", "young_adult"],"flag_severity": ["medium", "high"],"flag_source": ["keyword", "ai", "sos"],"flag_status": ["open", "reviewing", "resolved"],"message_kind": ["text", "checkin"],"note_sticker": ["shell", "lily", "axolotl"],"request_status": ["requested", "accepted", "declined"],"situation_tag": ["er_discharge", "anxiety", "depression", "self_harm", "eating_concerns", "substance_use", "school_stress", "bullying", "grief", "family_conflict"],"stage": ["just_after_crisis", "newly_diagnosed", "long_term"],"thread_kind": ["mentor", "private"],"time_of_day": ["morning", "afternoon", "evening", "night"]
          }
        }
} as const
