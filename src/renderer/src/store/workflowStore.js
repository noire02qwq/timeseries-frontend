/**
 * Workflow State Management
 * Centralized store for managing the complete ML workflow
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const WORKFLOW_STEPS = {
  DATA_UPLOAD: 'data_upload',
  DATA_SPLIT: 'data_split',
  MODEL_CONFIG: 'model_config',
  TRAINING: 'training',
  RESULTS: 'results'
}

export const useWorkflowStore = create(
  persist(
    (set, get) => ({
      // Current workflow step
      currentStep: WORKFLOW_STEPS.DATA_UPLOAD,

      // Global settings
      dataMode: 'sequential', // 'sequential' or 'tabular'
      trainingMode: 'manual', // 'manual' or 'autotune'

      // Data state
      dataset: {
        id: null,
        fileName: null,
        fileSize: null,
        rowCount: 0,
        columns: [],
        columnRoles: {},
        previewData: null
      },

      // Split configuration
      splitConfig: {
        trainRatio: 0.7,
        valRatio: 0.15,
        testRatio: 0.15,
        shuffle: false,
        seed: 42,
        splitId: null, // Assigned after split
        trainPath: null,
        valPath: null,
        testPath: null
      },

      // Model configuration
      modelConfig: {
        category: 'dl', // 'dl' or 'ml'
        modelType: 'LSTM',
        params: {},
        maxEpochs: 500,
        seed: 42,
        outputDir: './output'
      },

      // Training state
      training: {
        jobId: null,
        status: 'idle', // 'idle', 'pending', 'running', 'completed', 'failed', 'stopped'
        progress: 0,
        logs: [],
        result: null,
        error: null
      },

      // Tuning state (for autotune mode)
      tuning: {
        jobId: null,
        status: 'idle',
        progress: 0,
        logs: [],
        result: null,
        error: null
      },

      // Actions
      setCurrentStep: (step) => set({ currentStep: step }),

      setDataMode: (mode) => set({ dataMode: mode }),

      setTrainingMode: (mode) => set({ trainingMode: mode }),

      setDataset: (dataset) => set((state) => ({
        dataset: { ...state.dataset, ...dataset }
      })),

      setColumnRole: (column, role) => set((state) => ({
        dataset: {
          ...state.dataset,
          columnRoles: {
            ...state.dataset.columnRoles,
            [column]: role
          }
        }
      })),

      setSplitConfig: (config) => set((state) => ({
        splitConfig: { ...state.splitConfig, ...config }
      })),

      setModelConfig: (config) => set((state) => ({
        modelConfig: { ...state.modelConfig, ...config }
      })),

      setTraining: (training) => set((state) => ({
        training: { ...state.training, ...training }
      })),

      setTuning: (tuning) => set((state) => ({
        tuning: { ...state.tuning, ...tuning }
      })),

      addTrainingLog: (log) => set((state) => ({
        training: {
          ...state.training,
          logs: [...state.training.logs, log]
        }
      })),

      resetWorkflow: () => set({
        currentStep: WORKFLOW_STEPS.DATA_UPLOAD,
        dataset: {
          id: null,
          fileName: null,
          fileSize: null,
          rowCount: 0,
          columns: [],
          columnRoles: {},
          previewData: null
        },
        splitConfig: {
          trainRatio: 0.7,
          valRatio: 0.15,
          testRatio: 0.15,
          shuffle: false,
          seed: 42,
          splitId: null,
          trainPath: null,
          valPath: null,
          testPath: null
        },
        training: {
          jobId: null,
          status: 'idle',
          progress: 0,
          logs: [],
          result: null,
          error: null
        },
        tuning: {
          jobId: null,
          status: 'idle',
          progress: 0,
          logs: [],
          result: null,
          error: null
        }
      }),

      // Getters
      getInputColumns: () => {
        const state = get()
        return Object.entries(state.dataset.columnRoles)
          .filter(([, role]) => role === 'input')
          .map(([col]) => col)
      },

      getOutputColumns: () => {
        const state = get()
        return Object.entries(state.dataset.columnRoles)
          .filter(([, role]) => role === 'output')
          .map(([col]) => col)
      },

      canProceedToTraining: () => {
        const state = get()
        return (
          state.dataset.id !== null &&
          state.splitConfig.splitId !== null &&
          state.getInputColumns().length > 0 &&
          state.getOutputColumns().length > 0
        )
      }
    }),
    {
      name: 'dbps-workflow-storage',
      partialize: (state) => ({
        currentStep: state.currentStep,
        dataMode: state.dataMode,
        trainingMode: state.trainingMode,
        dataset: state.dataset,
        splitConfig: state.splitConfig,
        modelConfig: state.modelConfig,
      })
    }
  )
)

export default useWorkflowStore
