import { createAdminClient } from '../server'
import type { Database, Tables, TablesInsert, TablesUpdate } from '../types'
let purifyInstance: any = null

export function sanitizeHtml(dirty: string): string {
  if (!purifyInstance) {
    // Lazy load JSDOM and DOMPurify to prevent Next.js build errors
    // JSDOM does fs.readFileSync during initialization which breaks Next.js static generation
    const { JSDOM } = require('jsdom')
    const DOMPurify = require('dompurify')
    
    const window = new JSDOM('').window
    purifyInstance = DOMPurify(window)
    
    // Optional: Add a hook to force all links to open in a new tab securely
    purifyInstance.addHook('afterSanitizeAttributes', function(node: any) {
      if ('target' in node) {
        node.setAttribute('target', '_blank')
        node.setAttribute('rel', 'noopener noreferrer')
      }
    })
  }

  // By NOT providing ALLOWED_TAGS, we use DOMPurify's default heavily-researched list.
  return purifyInstance.sanitize(dirty) as string
}

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

  static async getTemplateById(id: string) {
    const { data, error } = await this.client
      .from('templates')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw new Error(`Failed to fetch template ${id}: ${error.message}`)
    return data
  }

  static async updateTemplate(id: string, updates: TablesUpdate<'templates'>) {
    const { data, error } = await this.client
      .from('templates')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update template ${id}: ${error.message}`)
    return data
  }

  // --- ARTICLES ---
  static async getArticles(opts?: { limit?: number; cursor?: string }) {
    const limit = Math.min(opts?.limit || 20, 100)
    let query = this.client
      .from('articles')
      .select('*, templates(*)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (opts?.cursor) {
      query = query.lt('created_at', opts.cursor)
    }

    const { data, error } = await query
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
    if (article.content) {
      article.content = sanitizeHtml(article.content)
    }
    const { data, error } = await this.client
      .from('articles')
      .insert(article)
      .select()
      .single()

    if (error) throw new Error(`Failed to create article: ${error.message}`)
    return data
  }

  static async updateArticle(id: string, updates: TablesUpdate<'articles'>) {
    if (updates.content) {
      updates.content = sanitizeHtml(updates.content)
    }
    const { data, error } = await this.client
      .from('articles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update article ${id}: ${error.message}`)
    return data
  }

  static async deleteArticle(id: string) {
    const { data, error } = await this.client
      .from('articles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to delete article ${id}: ${error.message}`)
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

  static async createSiteConfig(config: TablesInsert<'site_configs'>) {
    const { data, error } = await this.client
      .from('site_configs')
      .insert(config)
      .select()
      .single()

    if (error) throw new Error(`Failed to create site config: ${error.message}`)
    return data
  }

  static async getSiteConfigById(id: string) {
    const { data, error } = await this.client
      .from('site_configs')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(`Failed to fetch site config ${id}: ${error.message}`)
    return data
  }

  static async updateSiteConfig(id: string, updates: TablesUpdate<'site_configs'>) {
    const { data, error } = await this.client
      .from('site_configs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update site config ${id}: ${error.message}`)
    return data
  }

  // --- TRANSLATIONS ---
  static async getTranslations(filters?: { status?: string; articleId?: string; limit?: number; cursor?: string }) {
    const limit = Math.min(filters?.limit || 20, 100)
    let query = this.client
      .from('translations')
      .select('*, articles(title), site_configs(domain, language_code)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.articleId) {
      query = query.eq('article_id', filters.articleId)
    }
    if (filters?.cursor) {
      query = query.lt('created_at', filters.cursor)
    }

    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch translations: ${error.message}`)
    return data
  }

  static async getTranslationById(id: string) {
    const { data, error } = await this.client
      .from('translations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(`Failed to fetch translation ${id}: ${error.message}`)
    return data
  }

  static async getPublishedTranslation(domain: string, templateSlug: string) {
    const { data, error } = await this.client
      .from('translations')
      .select('*, site_configs!inner(domain), articles!inner(templates!inner(slug))')
      .eq('site_configs.domain', domain)
      .eq('articles.templates.slug', templateSlug)
      .eq('status', 'qa_approved')
      .maybeSingle()

    if (error) throw new Error(`Failed to fetch published translation: ${error.message}`)
    return data
  }

  static async upsertTranslation(translation: TablesInsert<'translations'>) {
    // 1. Fetch existing version to increment it (preserves translation history)
    if (translation.article_id && translation.site_config_id) {
      const { data: existing } = await this.client
        .from('translations')
        .select('version')
        .eq('article_id', translation.article_id)
        .eq('site_config_id', translation.site_config_id)
        .maybeSingle()
      
      translation.version = existing ? (existing.version || 1) + 1 : 1
    } else {
      translation.version = 1
    }

    // 2. Upsert the translation with the new version
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

    // If a human is approving or flagging the translation, mark it as human reviewed
    if (status === 'qa_approved' || status === 'flagged') {
      updatePayload.qa_human_reviewed = true
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

  static async getKeywordsForTemplateBatch(templateId: string, languageCodes: string[]) {
    if (languageCodes.length === 0) return []
    const { data, error } = await this.client
      .from('keywords')
      .select('*')
      .eq('template_id', templateId)
      .in('language_code', languageCodes)

    if (error) throw new Error(`Failed to fetch batched keywords: ${error.message}`)
    return data || []
  }

  static async saveKeywords(payload: TablesInsert<'keywords'>) {
    const { data, error } = await this.client
      .from('keywords')
      .upsert(payload, { onConflict: 'template_id,language_code' })
      .select()
      .single()

    if (error) throw new Error(`Failed to save keywords: ${error.message}`)
    return data
  }

  // --- INDEXING STATS ---
  static async recordIndexingStats(siteConfigId: string, stats: {
    date: string            // YYYY-MM-DD
    total_clicks: number
    total_impressions: number
    avg_ctr: number
    avg_position: number
  }) {
    const { data, error } = await this.client
      .from('indexing_stats' as any)
      .upsert(
        { ...stats, site_config_id: siteConfigId },
        { onConflict: 'site_config_id,date' } // Upsert so re-running the cron on the same day updates instead of errors
      )
      .select()
      .single()

    if (error) throw new Error(`Failed to record indexing stats: ${error.message}`)
    return data
  }

  // --- PUBLISH LOG ---
  static async logPublishAction(log: TablesInsert<'publish_log'>) {
    const { data, error } = await this.client
      .from('publish_log')
      .insert(log)
      .select()
      .single()

    if (error) throw new Error(`Failed to insert publish log: ${error.message}`)
    return data
  }
}


