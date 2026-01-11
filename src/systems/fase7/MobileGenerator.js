/**
 * MobileGenerator - Gerador Mobile
 * 
 * Gera código mobile completo.
 * 
 * Geradores:
 * - Expo Screen
 * - WatermelonDB Model
 * - Sync Service
 */

import BaseSystem from '../../core/BaseSystem.js';

class MobileGenerator extends BaseSystem {
  async onInitialize() {
    this.generations = new Map();
    this.logger?.info('MobileGenerator inicializado');
  }

  async onExecute(context) {
    const { action, type, parameters = {}, options = {}, generationId } = context;

    if (!action) {
      throw new Error('action é obrigatório no contexto');
    }

    if (action === 'generate') {
      if (!type) {
        throw new Error('type é obrigatório para generate');
      }
      return await this.generateMobileCode(type, parameters, options, generationId);
    } else if (action === 'getGeneration') {
      if (!generationId) {
        throw new Error('generationId é obrigatório para getGeneration');
      }
      return this.getGeneration(generationId);
    } else {
      throw new Error(`Ação desconhecida: ${action}`);
    }
  }

  async generateMobileCode(type, parameters, options = {}, generationId = null) {
    let code;

    switch (type) {
      case 'expo-screen':
        code = await this.generateExpoScreen(parameters, options);
        break;
      case 'watermelon-model':
        code = await this.generateWatermelonModel(parameters, options);
        break;
      case 'sync-service':
        code = await this.generateSyncService(parameters, options);
        break;
      default:
        throw new Error(`Tipo de geração desconhecido: ${type}`);
    }

    let validation = { valid: code && code.length > 0, issues: [] };
    const result = { type, code, parameters, validation, generatedAt: new Date().toISOString() };
    const id = generationId || `generation-${Date.now()}`;
    this.generations.set(id, result);

    return result;
  }

  async generateExpoScreen(parameters, options) {
    const { screenName = 'Home', screenTitle = 'Home' } = parameters;

    return `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function ${screenName}Screen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>${screenTitle}</Text>
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
});`;
  }

  async generateWatermelonModel(parameters, options) {
    const { modelName = 'Model', tableName = 'models' } = parameters;

    return `import { Model } from '@nozbe/watermelondb';
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators';

export default class ${modelName} extends Model {
  static table = '${tableName}';

  @text('name') name;
  @text('description') description;
  @date('created_at') createdAt;
  @date('updated_at') updatedAt;
}`;
  }

  async generateSyncService(parameters, options) {
    const { migrationVersion = 1, syncInterval = 60000 } = parameters;

    return `import { synchronize } from '@nozbe/watermelondb/sync';
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
        migrationsEnabledAtVersion: ${migrationVersion},
      });
    } catch (error) {
      console.error('Erro na sincronização', error);
      throw error;
    }
  }

  async syncInBackground() {
    setInterval(() => {
      this.sync().catch(console.error);
    }, ${syncInterval});
  }
}

export default SyncService;`;
  }

  getGeneration(generationId) {
    return this.generations.get(generationId) || null;
  }

  getStats() {
    const all = Array.from(this.generations.values());
    return {
      totalGenerations: all.length,
      validGenerations: all.filter(g => !g.validation || g.validation.valid).length
    };
  }

  onValidate(context) {
    if (!context || typeof context !== 'object') {
      return { valid: false, errors: ['Context deve ser um objeto'] };
    }
    if (!context.action || typeof context.action !== 'string') {
      return { valid: false, errors: ['action é obrigatório e deve ser string'] };
    }
    return { valid: true };
  }

  onGetDependencies() {
    return ['logger', 'config'];
  }
}

export default MobileGenerator;

export function createMobileGenerator(config = null, logger = null, errorHandler = null) {
  return new MobileGenerator(config, logger, errorHandler);
}
