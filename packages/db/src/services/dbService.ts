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

  static async deleteTemplate(id: string) {
    // Soft delete by setting deleted_at
    const { data, error } = await this.client
      .from('templates')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to delete template ${id}: ${error.message}`)
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

  static async getArticleByTemplateAndSlug(templateId: string, slug: string) {
    const { data, error } = await this.client
      .from('articles')
      .select('id')
      .eq('template_id', templateId)
      .eq('slug', slug)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw new Error(`Failed to lookup article slug: ${error.message}`)
    return data
  }

  static async createArticle(article: TablesInsert<'articles'>) {
    // Sanitization should happen at the API/Client level, not the DB layer.
    const { data, error } = await this.client
      .from('articles')
      .insert(article)
      .select()
      .single()

    if (error) throw new Error(`Failed to create article: ${error.message}`)
    return data
  }

  static async updateArticle(id: string, updates: TablesUpdate<'articles'>) {
    // Sanitization should happen at the API/Client level, not the DB layer.
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
  /** @param activeOnly default true — pipeline callers; pass false for admin config UI */
  static async getSiteConfigByDomain(domain: string) {
    const { data, error } = await this.client
      .from('site_configs')
      .select('*')
      .eq('domain', domain)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data || null
  }

  static async getPublishedArticlesForDomain(domain: string, limit?: number) {
    let query = this.client
      .from('translations')
      .select('*, articles!inner(slug, templates!inner(slug)), site_configs!inner(domain)')
      .eq('site_configs.domain', domain)
      .eq('status', 'published')
      .is('deleted_at', null)
      .is('articles.deleted_at', null)
      .order('updated_at', { ascending: false })
      
    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  static async getSiteConfigs(options?: { activeOnly?: boolean }) {
    const activeOnly = options?.activeOnly !== false
    let query = this.client.from('site_configs').select('*').order('domain')

    if (activeOnly) {
      query = query.eq('active', true)
    }

    const { data, error } = await query

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
      .select('*, articles!inner(title), site_configs(domain, language_code)')
      .is('deleted_at', null)
      .is('articles.deleted_at', null)
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

  static async getPublishedTranslation(domain: string, templateSlug: string, articleSlug: string) {
    const { data, error } = await this.client
      .from('translations')
      .select(
        '*, site_configs!inner(domain), articles!inner(slug, templates!inner(slug))'
      )
      .eq('site_configs.domain', domain)
      .eq('articles.templates.slug', templateSlug)
      .eq('articles.slug', articleSlug)
      .eq('status', 'published')
      .is('deleted_at', null)
      .is('articles.deleted_at', null)
      .limit(1)
      .maybeSingle()

    if (error) throw new Error(`Failed to fetch published translation: ${error.message}`)

    // article_css may be absent on older cloud schemas; load separately when available.
    if (data?.articles && typeof data.articles === 'object') {
      const articleId = (data as { article_id?: string }).article_id
      if (articleId) {
        const { data: cssRow, error: cssErr } = await this.client
          .from('articles')
          .select('article_css')
          .eq('id', articleId)
          .maybeSingle()
        if (!cssErr && cssRow && 'article_css' in cssRow) {
          ;(data.articles as { article_css?: string | null }).article_css =
            cssRow.article_css
        }
      }
    }

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

  /**
   * Set status=processing without wiping existing translated_* fields.
   */
  static async markTranslationProcessing(
    articleId: string,
    siteConfigId: string,
    languageCode: string,
    countryCode: string
  ) {
    const { data: existing } = await this.client
      .from('translations')
      .select('id')
      .eq('article_id', articleId)
      .eq('site_config_id', siteConfigId)
      .maybeSingle()

    if (existing) {
      return this.updateTranslation(existing.id, {
        status: 'processing',
        last_error: null,
      })
    }

    return this.upsertTranslation({
      article_id: articleId,
      site_config_id: siteConfigId,
      language_code: languageCode,
      country_code: countryCode,
      status: 'processing',
      last_error: null,
    })
  }

  static async updateTranslation(id: string, updates: TablesUpdate<'translations'>) {
    const { data, error } = await this.client
      .from('translations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Failed to update translation ${id}: ${error.message}`)
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

    // Clear last_error when leaving failed/processing for a successful pipeline state
    if (status === 'processing') {
      updatePayload.last_error = null
    }
    if (['staging', 'qa_queue', 'qa_approved', 'published'].includes(status)) {
      updatePayload.last_error = null
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

  /**
   * Mark a translation as permanently failed after BullMQ retries are exhausted.
   */
  static async markTranslationFailed(
    articleId: string,
    siteConfigId: string,
    errorMessage: string
  ) {
    const truncated =
      errorMessage.length > 2000 ? `${errorMessage.slice(0, 2000)}…` : errorMessage

    const { data, error } = await this.client
      .from('translations')
      .update({
        status: 'failed',
        last_error: truncated,
        updated_at: new Date().toISOString(),
      })
      .eq('article_id', articleId)
      .eq('site_config_id', siteConfigId)
      .select()
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to mark translation failed: ${error.message}`)
    }
    return data
  }

  // --- IMAGE TRANSLATION ---

  static async getImageTranslationCache(imageHash: string, targetLocale: string) {
    const { data, error } = await this.client
      .from('image_translation_cache')
      .select('*')
      .eq('image_hash', imageHash)
      .eq('target_locale', targetLocale)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch image translation cache: ${error.message}`)
    }
    return data
  }

  static async saveImageTranslationCache(payload: TablesInsert<'image_translation_cache'>) {
    const { data, error } = await this.client
      .from('image_translation_cache')
      .upsert(payload, { onConflict: 'image_hash,target_locale' })
      .select()
      .single()

    if (error) throw new Error(`Failed to save image translation cache: ${error.message}`)
    return data
  }

  /**
   * Upload a rendered translated image to the public images bucket.
   * Returns the public URL for embedding in translated content.
   */
  static async uploadTranslatedImage(path: string, png: Buffer): Promise<string> {
    const { error } = await this.client.storage
      .from('images')
      .upload(path, png, { contentType: 'image/png', upsert: true })

    if (error) throw new Error(`Failed to upload translated image: ${error.message}`)

    const { data } = this.client.storage.from('images').getPublicUrl(path)
    return data.publicUrl
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

  static async getKeywordsByArticleAndLanguage(articleId: string, languageCode: string) {
    const { data, error } = await this.client
      .from('keywords')
      .select('*')
      .eq('article_id', articleId)
      .eq('language_code', languageCode)
      .single()

    // .single() throws if no rows match, but we don't want to fail, just return null
    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch keywords: ${error.message}`)
    }
    return data
  }


  static async saveKeywords(payload: TablesInsert<'keywords'>) {
    const { data, error } = await this.client
      .from('keywords')
      .upsert(payload, { onConflict: 'article_id,language_code' })
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

  static async getPublishLogs(filters?: { limit?: number; cursor?: string; siteId?: string }) {
    const limit = Math.min(filters?.limit || 50, 100)
    let query = this.client
      .from('publish_log')
      .select('*, translations(translated_title), site_configs(domain)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (filters?.siteId) {
      query = query.eq('site_config_id', filters.siteId)
    }
    if (filters?.cursor) {
      query = query.lt('created_at', filters.cursor)
    }

    const { data, error } = await query
    if (error) throw new Error(`Failed to fetch publish logs: ${error.message}`)
    return data
  }

  // --- DASHBOARD STATS ---
  static async getDashboardStats() {
    // We execute these concurrently for speed
    const [
      { count: templatesCount },
      { count: activeSitesCount },
      { count: totalTranslations },
      { data: funnelData },
      recentPublishLogs
    ] = await Promise.all([
      this.client.from('templates').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      this.client.from('site_configs').select('*', { count: 'exact', head: true }).eq('active', true),
      this.client.from('translations').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      (async () => {
        try {
          return await (this.client as any).rpc('get_translation_status_counts')
        } catch (e) {
          return null
        }
      })(), // If RPC doesn't exist, we fallback
      this.getPublishLogs({ limit: 5 })
    ])

    // Fallback if RPC isn't deployed: query distinct counts manually
    let pipeline = funnelData
    if (!pipeline) {
      const statuses = [
        'processing',
        'failed',
        'staging',
        'qa_queue',
        'qa_approved',
        'published',
        'flagged',
      ]
      const counts = await Promise.all(
        statuses.map(status =>
          this.client.from('translations')
            .select('*', { count: 'exact', head: true })
            .eq('status', status)
            .is('deleted_at', null)
        )
      )
      pipeline = statuses.reduce((acc, status, idx) => {
        acc[status] = counts[idx].count || 0
        return acc
      }, {} as Record<string, number>)
    } else {
      // Format RPC response if it exists
      pipeline = (pipeline as any[]).reduce((acc, row) => {
        acc[row.status] = row.count
        return acc
      }, {} as Record<string, number>)
    }

    return {
      overview: {
        templates: templatesCount || 0,
        activeSites: activeSitesCount || 0,
        totalTranslations: totalTranslations || 0,
      },
      pipeline,
      recentActivity: recentPublishLogs
    }
  }

  // --- ANALYTICS & MONITORING ---
  static async getCostAnalytics(days: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    // We fetch all records in the date range, then group them in JS to keep DB load low
    const { data: logs, error } = await this.client
      .from('cost_log')
      .select('*, translations(translated_title)')
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Failed to fetch cost analytics: ${error.message}`)

    const totalCost = logs.reduce((sum, log) => sum + Number(log.estimated_cost_usd || 0), 0)
    
    // Group by model
    const costByModel = logs.reduce((acc, log) => {
      const model = log.model || 'unknown'
      acc[model] = (acc[model] || 0) + Number(log.estimated_cost_usd || 0)
      return acc
    }, {} as Record<string, number>)

    // Group by day (YYYY-MM-DD)
    const dailySpend = logs.reduce((acc, log) => {
      const day = log.created_at ? log.created_at.split('T')[0] : 'Unknown'
      acc[day] = (acc[day] || 0) + Number(log.estimated_cost_usd || 0)
      return acc
    }, {} as Record<string, number>)

    return {
      totalCost,
      costByModel: Object.entries(costByModel).map(([name, value]) => ({ name, value })),
      dailySpend: Object.entries(dailySpend).map(([date, cost]) => ({ date, cost })).sort((a, b) => a.date.localeCompare(b.date)),
      rawLogs: logs
    }
  }

  static async getMonitoringStats(days: number = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const { data: stats, error } = await this.client
      .from('indexing_stats')
      .select('*, site_configs(domain)')
      .gte('date', cutoffDate.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (error) throw new Error(`Failed to fetch monitoring stats: ${error.message}`)

    // Aggregate by date across all sites
    const dailyAggregates = stats.reduce((acc, stat) => {
      const day = stat.date
      if (!acc[day]) {
        acc[day] = { date: day, clicks: 0, impressions: 0, avg_position: 0, count: 0 }
      }
      acc[day].clicks += stat.total_clicks || 0
      acc[day].impressions += stat.total_impressions || 0
      acc[day].avg_position += stat.avg_position || 0
      acc[day].count += 1
      return acc
    }, {} as Record<string, { date: string; clicks: number; impressions: number; avg_position: number; count: number }>)

    // Average the avg_position
    const dailyStats = Object.values(dailyAggregates).map(day => ({
      ...day,
      avg_position: day.count > 0 ? day.avg_position / day.count : 0
    }))

    return {
      dailyStats,
      rawStats: stats
    }
  }
}


