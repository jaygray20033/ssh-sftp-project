import { Router } from 'express'

import { validateBody, validateQuery } from '@common/middlewares'

import { CreateSnippetBodySchema, ListSnippetsQuerySchema, UpdateSnippetBodySchema } from './dto'
import SnippetController from './snippet.controller'

const router = Router()

router.get('/', validateQuery(ListSnippetsQuerySchema), SnippetController.getSnippets)
router.get('/:id', SnippetController.getSnippetById)
router.post('/', validateBody(CreateSnippetBodySchema), SnippetController.createSnippet)
router.patch('/:id', validateBody(UpdateSnippetBodySchema), SnippetController.updateSnippet)
router.delete('/:id', SnippetController.deleteSnippet)

export default router
