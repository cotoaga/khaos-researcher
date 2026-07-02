import { Logger } from '../utils/Logger.js';

/**
 * CuratedOpenWeightSource - Landmark open-weight models
 *
 * Static curated list of landmark open-weight models from Meta, Mistral,
 * DeepSeek, Microsoft (Phi), Cohere, and Alibaba (Qwen).
 * All release dates are verified from official announcements.
 */
export class CuratedOpenWeightSource {
  constructor() {
    this.name = 'OpenWeight';
    this.logger = new Logger('CuratedOpenWeight');
  }

  async fetchModels() {
    const models = this.getCuratedModels();
    this.logger.info(`📦 Loaded ${models.length} curated open-weight landmark models`);
    return models;
  }

  getCuratedModels() {
    return [
      // Meta — LLaMA family
      {
        provider: 'Meta',
        id: 'llama-1',
        created: 1677196800, // 2023-02-24
        capabilities: ['reasoning', 'code', 'open-weight'],
        metadata: {
          displayName: 'LLaMA 1',
          family: 'llama',
          tier: 'v1',
          release_date: '2023-02-24',
          license: 'research',
          official: true
        }
      },
      {
        provider: 'Meta',
        id: 'llama-2',
        created: 1689638400, // 2023-07-18
        capabilities: ['reasoning', 'code', 'open-weight', 'commercial'],
        metadata: {
          displayName: 'LLaMA 2',
          family: 'llama',
          tier: 'v2',
          release_date: '2023-07-18',
          license: 'llama2-community',
          official: true
        }
      },
      {
        provider: 'Meta',
        id: 'llama-3',
        created: 1713398400, // 2024-04-18
        capabilities: ['reasoning', 'code', 'open-weight', 'commercial', 'instruction-following'],
        metadata: {
          displayName: 'LLaMA 3',
          family: 'llama',
          tier: 'v3',
          release_date: '2024-04-18',
          license: 'llama3',
          official: true
        }
      },
      {
        provider: 'Meta',
        id: 'llama-3.1',
        created: 1721692800, // 2024-07-23
        capabilities: ['reasoning', 'code', 'open-weight', 'commercial', 'instruction-following', 'extended-context'],
        metadata: {
          displayName: 'LLaMA 3.1',
          family: 'llama',
          tier: 'v3.1',
          release_date: '2024-07-23',
          license: 'llama3.1',
          official: true
        }
      },
      {
        provider: 'Meta',
        id: 'llama-3.2',
        created: 1727222400, // 2024-09-25
        capabilities: ['reasoning', 'code', 'open-weight', 'commercial', 'multimodal', 'vision'],
        metadata: {
          displayName: 'LLaMA 3.2',
          family: 'llama',
          tier: 'v3.2',
          release_date: '2024-09-25',
          license: 'llama3.2',
          official: true
        }
      },
      {
        provider: 'Meta',
        id: 'llama-3.3',
        created: 1733443200, // 2024-12-06
        capabilities: ['reasoning', 'code', 'open-weight', 'commercial', 'instruction-following'],
        metadata: {
          displayName: 'LLaMA 3.3',
          family: 'llama',
          tier: 'v3.3',
          release_date: '2024-12-06',
          license: 'llama3.3',
          official: true
        }
      },

      // Mistral
      {
        provider: 'Mistral',
        id: 'mistral-7b',
        created: 1695772800, // 2023-09-27
        capabilities: ['reasoning', 'code', 'open-weight', 'efficient'],
        metadata: {
          displayName: 'Mistral 7B',
          family: 'mistral',
          tier: '7b',
          release_date: '2023-09-27',
          license: 'apache-2.0',
          official: true
        }
      },
      {
        provider: 'Mistral',
        id: 'mixtral-8x7b',
        created: 1702252800, // 2023-12-11
        capabilities: ['reasoning', 'code', 'open-weight', 'mixture-of-experts'],
        metadata: {
          displayName: 'Mixtral 8x7B',
          family: 'mixtral',
          tier: '8x7b',
          release_date: '2023-12-11',
          license: 'apache-2.0',
          official: true
        }
      },
      {
        provider: 'Mistral',
        id: 'mistral-small',
        created: 1708905600, // 2024-02-26
        capabilities: ['reasoning', 'code', 'analysis', 'efficient'],
        metadata: {
          displayName: 'Mistral Small',
          family: 'mistral',
          tier: 'small',
          release_date: '2024-02-26',
          official: true
        }
      },
      {
        provider: 'Mistral',
        id: 'mistral-large',
        created: 1708905600, // 2024-02-26
        capabilities: ['reasoning', 'code', 'analysis', 'extended-context'],
        metadata: {
          displayName: 'Mistral Large',
          family: 'mistral',
          tier: 'large',
          release_date: '2024-02-26',
          official: true
        }
      },
      {
        provider: 'Mistral',
        id: 'mistral-nemo',
        created: 1721260800, // 2024-07-18
        capabilities: ['reasoning', 'code', 'open-weight', 'efficient', 'extended-context'],
        metadata: {
          displayName: 'Mistral Nemo',
          family: 'mistral',
          tier: 'nemo',
          release_date: '2024-07-18',
          license: 'apache-2.0',
          official: true
        }
      },

      // DeepSeek
      {
        provider: 'DeepSeek',
        id: 'deepseek-coder',
        created: 1698796800, // 2023-11-01
        capabilities: ['code', 'open-weight', 'analysis'],
        metadata: {
          displayName: 'DeepSeek Coder',
          family: 'deepseek-coder',
          tier: 'coder',
          release_date: '2023-11-01',
          license: 'deepseek',
          official: true
        }
      },
      {
        provider: 'DeepSeek',
        id: 'deepseek-v2',
        created: 1715040000, // 2024-05-07
        capabilities: ['reasoning', 'code', 'open-weight', 'mixture-of-experts', 'efficient'],
        metadata: {
          displayName: 'DeepSeek-V2',
          family: 'deepseek-v2',
          tier: 'v2',
          release_date: '2024-05-07',
          license: 'deepseek',
          official: true
        }
      },
      {
        provider: 'DeepSeek',
        id: 'deepseek-v3',
        created: 1735171200, // 2024-12-26
        capabilities: ['reasoning', 'code', 'open-weight', 'analysis', 'extended-context'],
        metadata: {
          displayName: 'DeepSeek-V3',
          family: 'deepseek-v3',
          tier: 'v3',
          release_date: '2024-12-26',
          license: 'deepseek',
          official: true
        }
      },
      {
        provider: 'DeepSeek',
        id: 'deepseek-r1',
        created: 1737331200, // 2025-01-20
        capabilities: ['reasoning', 'code', 'open-weight', 'advanced-reasoning', 'analysis'],
        metadata: {
          displayName: 'DeepSeek-R1',
          family: 'deepseek-r1',
          tier: 'r1',
          release_date: '2025-01-20',
          license: 'mit',
          official: true
        }
      },

      // Microsoft — Phi family
      {
        provider: 'Microsoft',
        id: 'phi-1',
        created: 1687219200, // 2023-06-20
        capabilities: ['code', 'reasoning', 'open-weight', 'efficient'],
        metadata: {
          displayName: 'Phi-1',
          family: 'phi',
          tier: 'phi-1',
          release_date: '2023-06-20',
          license: 'mit',
          official: true
        }
      },
      {
        provider: 'Microsoft',
        id: 'phi-2',
        created: 1702339200, // 2023-12-12
        capabilities: ['reasoning', 'code', 'open-weight', 'efficient', 'analysis'],
        metadata: {
          displayName: 'Phi-2',
          family: 'phi',
          tier: 'phi-2',
          release_date: '2023-12-12',
          license: 'mit',
          official: true
        }
      },
      {
        provider: 'Microsoft',
        id: 'phi-3-mini',
        created: 1713830400, // 2024-04-23
        capabilities: ['reasoning', 'code', 'open-weight', 'efficient', 'instruction-following'],
        metadata: {
          displayName: 'Phi-3 Mini',
          family: 'phi',
          tier: 'phi-3-mini',
          release_date: '2024-04-23',
          license: 'mit',
          official: true
        }
      },
      {
        provider: 'Microsoft',
        id: 'phi-4',
        created: 1733961600, // 2024-12-12
        capabilities: ['reasoning', 'code', 'open-weight', 'efficient', 'analysis', 'advanced-reasoning'],
        metadata: {
          displayName: 'Phi-4',
          family: 'phi',
          tier: 'phi-4',
          release_date: '2024-12-12',
          license: 'mit',
          official: true
        }
      },

      // Cohere
      {
        provider: 'Cohere',
        id: 'command',
        created: 1675209600, // 2023-02-01
        capabilities: ['reasoning', 'analysis', 'instruction-following'],
        metadata: {
          displayName: 'Command',
          family: 'command',
          tier: 'command',
          release_date: '2023-02-01',
          official: true
        }
      },
      {
        provider: 'Cohere',
        id: 'command-r',
        created: 1710115200, // 2024-03-11
        capabilities: ['reasoning', 'analysis', 'instruction-following', 'extended-context', 'rag'],
        metadata: {
          displayName: 'Command R',
          family: 'command',
          tier: 'command-r',
          release_date: '2024-03-11',
          official: true
        }
      },
      {
        provider: 'Cohere',
        id: 'command-r-plus',
        created: 1712188800, // 2024-04-04
        capabilities: ['reasoning', 'analysis', 'instruction-following', 'extended-context', 'rag', 'advanced-reasoning'],
        metadata: {
          displayName: 'Command R+',
          family: 'command',
          tier: 'command-r-plus',
          release_date: '2024-04-04',
          official: true
        }
      },

      // Alibaba — Qwen family
      {
        provider: 'Alibaba',
        id: 'qwen-7b',
        created: 1695600000, // 2023-09-25
        capabilities: ['reasoning', 'code', 'open-weight', 'multilingual'],
        metadata: {
          displayName: 'Qwen 7B',
          family: 'qwen',
          tier: 'qwen-1',
          release_date: '2023-09-25',
          license: 'qianwen',
          official: true
        }
      },
      {
        provider: 'Alibaba',
        id: 'qwen1.5',
        created: 1707091200, // 2024-02-05
        capabilities: ['reasoning', 'code', 'open-weight', 'multilingual', 'instruction-following'],
        metadata: {
          displayName: 'Qwen 1.5',
          family: 'qwen',
          tier: 'qwen-1.5',
          release_date: '2024-02-05',
          license: 'qianwen',
          official: true
        }
      },
      {
        provider: 'Alibaba',
        id: 'qwen2',
        created: 1717632000, // 2024-06-06
        capabilities: ['reasoning', 'code', 'open-weight', 'multilingual', 'extended-context'],
        metadata: {
          displayName: 'Qwen 2',
          family: 'qwen',
          tier: 'qwen-2',
          release_date: '2024-06-06',
          license: 'apache-2.0',
          official: true
        }
      },
      {
        provider: 'Alibaba',
        id: 'qwen2.5',
        created: 1726617600, // 2024-09-18
        capabilities: ['reasoning', 'code', 'open-weight', 'multilingual', 'extended-context', 'analysis'],
        metadata: {
          displayName: 'Qwen 2.5',
          family: 'qwen',
          tier: 'qwen-2.5',
          release_date: '2024-09-18',
          license: 'apache-2.0',
          official: true
        }
      }
    ];
  }
}
