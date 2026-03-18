export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[]

type TableDefinition = {
	Row: Record<string, unknown>
	Insert: Record<string, unknown>
	Update: Record<string, unknown>
	Relationships: Array<{
		foreignKeyName: string
		columns: string[]
		isOneToOne: boolean
		referencedRelation: string
		referencedColumns: string[]
	}>
}

type ViewDefinition = {
	Row: Record<string, unknown>
	Relationships: Array<{
		foreignKeyName: string
		columns: string[]
		isOneToOne: boolean
		referencedRelation: string
		referencedColumns: string[]
	}>
}

type FunctionDefinition = {
	Args: Record<string, unknown>
	Returns: unknown
}

export type Database = {
	public: {
		Tables: Record<string, TableDefinition>
		Views: Record<string, ViewDefinition>
		Functions: Record<string, FunctionDefinition>
		Enums: Record<string, string>
		CompositeTypes: Record<string, Record<string, unknown>>
	}
}

export {}