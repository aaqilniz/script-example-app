import {Todo} from '../models';
import {TodoRepository} from '../repositories';
import {repository} from '@loopback/repository';
import {get, getModelSchemaRef, param, requestBody, response} from '@loopback/rest';
  
export class TodoController {
  constructor(@repository(TodoRepository)
  public todoRepository: TodoRepository,) {}

  @get('/ut')
  @response(200, {
    description: 'Todo custom model instance',
    content: {'application/json': {schema: getModelSchemaRef(Todo)}},
  })
  async find(): Promise<unknown> {
    return this.todoRepository.execute('SELECT * from Todo');
  }
  
}