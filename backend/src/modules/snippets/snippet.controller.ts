import { Request, Response } from 'express'

import { CreateSnippetBody, ListSnippetsQuerySchema, UpdateSnippetBody } from './dto'
import SnippetService from './snippet.service'

class SnippetController {
  static async getSnippets(req: Request, res: Response) {
    const query = ListSnippetsQuerySchema.parse(req.query)
    const snippets = await SnippetService.getSnippets(req.user!.id, query)
    return res.ok({ snippets }, { message: 'Snippets retrieved successfully' })
  }

  static async getSnippetById(req: Request, res: Response) {
    const snippet = await SnippetService.getSnippetById(req.params.id as string, req.user!.id)
    return res.ok({ snippet }, { message: 'Snippet retrieved successfully' })
  }

  static async createSnippet(req: Request, res: Response) {
    const snippet = await SnippetService.createSnippet(req.body as CreateSnippetBody, req.user!.id)
    return res.created({ snippet }, { message: 'Snippet created successfully' })
  }

  static async updateSnippet(req: Request, res: Response) {
    const snippet = await SnippetService.updateSnippet(
      req.params.id as string,
      req.user!.id,
      req.body as UpdateSnippetBody
    )
    return res.ok({ snippet }, { message: 'Snippet updated successfully' })
  }

  static async deleteSnippet(req: Request, res: Response) {
    await SnippetService.deleteSnippet(req.params.id as string, req.user!.id)
    return res.ok(null, { message: 'Snippet deleted successfully' })
  }
}

export default SnippetController
