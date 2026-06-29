import { supabase } from './supabase'

export const reportData = {
  async getReports() {
    const { data, error } = await supabase
      .from('reports')
      .select(
        `
        *,
        report_types(name),
        report_statuses(name),
        assignments(id, lineman:users(name))
      `,
      )
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async updateStatus(reportId, statusId) {
    const { data, error } = await supabase
      .from('reports')
      .update({ status_id: statusId })
      .eq('id', reportId)

    if (error) throw error
    return data
  },
}
