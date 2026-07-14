import { createAdminClient } from '../server'
import type { Database, Tables, TablesInsert, TablesUpdate } from '../types'


// Let client be instantiated on-demand inside the service methods


/**
 * Service class containing decoupled database query methods.
 * Implements defensive error handling and clear type signatures.
 */
export class DbService {
  private static _client: ReturnType<typeof createAdminClient> | null = null

  private static get client() {
    if (!this._client) {
      this._client = createAdminClient()
    }
    return this._client
  }
  
  // --- TEMPLATES ---
  static async getTemplates() {
    const { data, error } = await this.client
      .from('templates')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    
    if (error) throw new Error(`Failed to fetch templates: ${error.message}`)
    return data
  }

  static async createTemplate(template: TablesInsert<'templates'>) {
    const { data, error } = await this.client
      .from('templates')
      .insert(template)
      .select()
      .single()

    if (error) throw new Error(`Failed to create template: ${error.message}`)
    return data
  }

  // --- ARTICLES ---
  static async getArticles() {
    const { data, error } = await this.client
      .from('articles')
      .select('*, templates(*)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch articles: ${error.message}`)
    return data
  }

  static async getArticleById(id: string) {
    const { data, error } = await this.client
      .from('articles')
      .select('*, templates(*)')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw new Error(`Failed to fetch article ${id}: ${error.message}`)
    return data
  }

  static async createArticle(article: TablesInsert<'articles'>) {
    const { data, error } = await this.client
      .from('articles')
      .insert(article)
      .select()
      .single()

    if (error) throw new Error(`Failed to create article: ${error.message}`)
    return data
  }

  static async updateArticle(id: string, updates: TablesUpdate<'articles'>) {
    const { data, error } = await this.client
      .from('articles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update article ${id}: ${error.message}`)
    return data
  }

  // --- SITE CONFIGURATIONS ---
  static async getSiteConfigs() {
    const { data, error } = await this.client
      .from('site_configs')
      .select('*')
      .eq('active', true)

    if (error) throw new Error(`Failed to fetch site configs: ${error.message}`)
    return data
  }

  // --- TRANSLATIONS ---
  static async upsertTranslation(translation: TablesInsert<'translations'>) {
    const { data, error } = await this.client
      .from('translations')
      .upsert(translation, { onConflict: 'article_id,site_config_id' })
      .select()
      .single()

    if (error) throw new Error(`Failed to upsert translation: ${error.message}`)
    return data
  }

  static async updateTranslationStatus(id: string, status: string, reviewerNotes?: string) {
    const updatePayload: TablesUpdate<'translations'> = { 
      status, 
      updated_at: new Date().toISOString() 
    }
    if (reviewerNotes !== undefined) {
      updatePayload.qa_reviewer_notes = reviewerNotes
    }

    const { data, error } = await this.client
      .from('translations')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update translation status for ${id}: ${error.message}`)
    return data
  }

  // --- LOGGING & METRICS ---
  static async logCost(log: TablesInsert<'cost_log'>) {
    const { data, error } = await this.client
      .from('cost_log')
      .insert(log)
      .select()
      .single()

    if (error) throw new Error(`Failed to insert cost log: ${error.message}`)
    return data
  }

  // --- KEYWORDS ---
  static async getKeywordsForTemplate(templateId: string, languageCode: string) {
    const { data, error } = await this.client
      .from('keywords')
      .select('*')
      .eq('template_id', templateId)
      .eq('language_code', languageCode)
      .maybeSingle()

    if (error) throw new Error(`Failed to fetch keywords: ${error.message}`)
    return data
  }
}


