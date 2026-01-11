/**
 * MobileTemplateManager - Gerenciador de Templates Mobile
 * 
 * Gerencia templates específicos para desenvolvimento mobile.
 * 
 * Templates disponíveis:
 * - Expo Screen
 * - WatermelonDB Model
 * - Sync Service
 * - Offline Queue
 * 
 * Métricas de Sucesso:
 * - 100% dos templates mobile disponíveis
 * - 100% dos templates são válidos e funcionais
 */

import BaseSystem from '../../core/BaseSystem.js';

class MobileTemplateManager extends BaseSystem {
  async onInitialize() {
    this.templates = new Map();
    this.initializeTemplates();
    this.logger?.info('MobileTemplateManager inicializado');
  }

  /**
   * Inicializa templates mobile
   */
  initializeTemplates() {
    // Template: Expo Screen
    this.templates.set('expo-screen', {
      id: 'expo-screen',
      name: 'Expo Screen',
      category: 'mobile',
      code: `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function {{ScreenName}}Screen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{{ScreenTitle}}</Text>
      {{#each components}}
      <{{ComponentName}} />
      {{/each}}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});`,
      description: 'Template para tela Expo Router',
      parameters: ['ScreenName', 'ScreenTitle', 'components', 'ComponentName']
    });

    // Template: WatermelonDB Model
    this.templates.set('watermelon-model', {
      id: 'watermelon-model',
      name: 'WatermelonDB Model',
      category: 'mobile',
      code: `import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export default class {{ModelName}} extends Model {
  static table = '{{tableName}}';

  @text('name') name;
  @text('description') description;
  {{#each fields}}
  @{{fieldType}}('{{fieldName}}') {{fieldName}};
  {{/each}}
  @date('created_at') createdAt;
  @date('updated_at') updatedAt;
}`,
      description: 'Template para modelo WatermelonDB',
      parameters: ['ModelName', 'tableName', 'fields', 'fieldType', 'fieldName']
    });

    // Template: Sync Service
    this.templates.set('sync-service', {
      id: 'sync-service',
      name: 'Sync Service',
      category: 'mobile',
      code: `import { synchronize } from '@nozbe/watermelondb/sync';
import database from './database';

class SyncService {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  async sync() {
    try {
      await synchronize({
        database,
        pullChanges: async ({ lastPulledAt }) => {
          const response = await this.apiClient.get('/sync', {
            params: { lastPulledAt }
          });
          return {
            changes: response.changes,
            timestamp: response.timestamp
          };
        },
        pushChanges: async ({ changes, lastPulledAt }) => {
          await this.apiClient.post('/sync', {
            changes,
            lastPulledAt
          });
        },
        migrationsEnabledAtVersion: {{migrationVersion}},
      });
    } catch (error) {
      console.error('Erro na sincronização', error);
      throw error;
    }
  }

  async syncInBackground() {
    // Implementar sincronização em background
    setInterval(() => {
      this.sync().catch(console.error);
    }, {{syncInterval}});
  }
}

export default SyncService;`,
      description: 'Template para serviço de sincronização',
      parameters: ['migrationVersion', 'syncInterval']
    });

    // Template: Offline Queue
    this.templates.set('offline-queue', {
      id: 'offline-queue',
      name: 'Offline Queue',
      category: 'mobile',
      code: `import AsyncStorage from '@react-native-async-storage/async-storage';

class OfflineQueue {
  constructor() {
    this.queueKey = 'offline_queue';
  }

  async enqueue(action) {
    const queue = await this.getQueue();
    queue.push({
      ...action,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    });
    await this.saveQueue(queue);
  }

  async dequeue() {
    const queue = await this.getQueue();
    if (queue.length === 0) {
      return null;
    }
    const action = queue.shift();
    await this.saveQueue(queue);
    return action;
  }

  async getQueue() {
    try {
      const data = await AsyncStorage.getItem(this.queueKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao obter fila', error);
      return [];
    }
  }

  async saveQueue(queue) {
    try {
      await AsyncStorage.setItem(this.queueKey, JSON.stringify(queue));
    } catch (error) {
      console.error('Erro ao salvar fila', error);
    }
  }

  async processQueue(apiClient) {
    while (true) {
      const action = await this.dequeue();
      if (!action) {
        break;
      }

      try {
        await this.executeAction(action, apiClient);
      } catch (error) {
        // Re-enfileirar em caso de erro
        await this.enqueue(action);
        throw error;
      }
    }
  }

  async executeAction(action, apiClient) {
    switch (action.type) {
      case 'CREATE':
        await apiClient.post(action.endpoint, action.data);
        break;
      case 'UPDATE':
        await apiClient.put(action.endpoint, action.data);
        break;
      case 'DELETE':
        await apiClient.delete(action.endpoint);
        break;
      default:
        throw new Error(\`Tipo de ação desconhecido: \${action.type}\`);
    }
  }
}

export default OfflineQueue;`,
      description: 'Template para fila offline',
      parameters: []
    });
  }

  /**
   * Gera código a partir de template
   * 
   * @param {Object} context - Contexto com action e templateId
   * @returns {Promise<Object>} Código gerado
   */
  async onExecute(context) {
    const { action, templateId, parameters = {} } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'generate') {
      if (!templateId) {
        throw new Error('templateId é obrigatório para generate');
      }
      return await this.generateFromTemplate(templateId, parameters);
    } else if (action === 'getTemplate') {
      if (!templateId) {
        throw new Error('templateId é obrigatório para getTemplate');
      }
      return this.getTemplate(templateId);
    } else if (action === 'listTemplates') {
      return this.listTemplates();
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  /**
   * Gera código a partir de template
   * 
   * @param {string} templateId - ID do template
   * @param {Object} parameters - Parâmetros
   * @returns {Promise<Object>} Código gerado
   */
  async generateFromTemplate(templateId, parameters) {
    const template = this.templates.get(templateId);

    if (!template) {
      throw new Error(`Template não encontrado: ${templateId}`);
    }

    // Substituir placeholders
    let code = template.code;
    for (const [key, value] of Object.entries(parameters)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      code = code.replace(placeholder, value);
    }

    const validation = this.validateGeneratedCode(code);

    return {
      templateId,
      code,
      parameters,
      validation,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Obtém template
   * 
   * @param {string} templateId - ID do template
   * @returns {Object|null} Template ou null
   */
  getTemplate(templateId) {
    return this.templates.get(templateId) || null;
  }

  /**
   * Lista todos os templates
   * 
   * @returns {Array<Object>} Lista de templates
   */
  listTemplates() {
    return Array.from(this.templates.values()).map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      description: t.description
    }));
  }

  /**
   * Valida código gerado
   * 
   * @param {string} code - Código gerado
   * @returns {Object} Resultado da validação
   */
  validateGeneratedCode(code) {
    const issues = [];

    if (!code || code.trim().length === 0) {
      issues.push({
        type: 'empty_code',
        severity: 'high',
        description: 'Código gerado está vazio'
      });
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Obtém estatísticas
   * 
   * @returns {Object} Estatísticas
   */
  getStats() {
    return {
      totalTemplates: this.templates.size,
      templates: Array.from(this.templates.keys())
    };
  }

  /**
   * Valida contexto
   * 
   * @param {Object} context - Contexto
   * @returns {Object} Resultado da validação
   */
  onValidate(context) {
    if (!context || typeof context !== 'object') {
      return { valid: false, errors: ['Context deve ser um objeto'] };
    }

    if (!context.action || typeof context.action !== 'string') {
      return { valid: false, errors: ['action é obrigatório e deve ser string'] };
    }

    return { valid: true };
  }

  /**
   * Retorna dependências do sistema
   * 
   * @returns {Array<string>} Dependências
   */
  onGetDependencies() {
    return ['logger', 'config'];
  }
}

export default MobileTemplateManager;

/**
 * Factory function para criar MobileTemplateManager
 * 
 * @param {Object} config - Configuração
 * @param {Object} logger - Logger
 * @param {Object} errorHandler - Error Handler
 * @returns {MobileTemplateManager} Instância do MobileTemplateManager
 */
export function createMobileTemplateManager(config = null, logger = null, errorHandler = null) {
  return new MobileTemplateManager(config, logger, errorHandler);
}
