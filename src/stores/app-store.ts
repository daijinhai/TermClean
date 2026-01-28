import { create } from 'zustand';
import type { Package, PackageManagerType } from '../types/index.js';

interface AppState {
    // 包列表
    packages: Package[];
    setPackages: (packages: Package[]) => void;
    updatePackageSize: (packageName: string, size: number) => void;

    // 选中的包
    selectedPackages: Set<string>;
    togglePackage: (packageName: string) => void;
    clearSelection: () => void;

    // 当前视图
    currentView: 'list' | 'detail' | 'preview';
    setCurrentView: (view: 'list' | 'detail' | 'preview') => void;

    // 高亮的包(用于详情视图)
    highlightedPackage: Package | null;
    setHighlightedPackage: (pkg: Package | null) => void;

    // 过滤器
    managerFilter: PackageManagerType | 'all';
    searchQuery: string;
    setManagerFilter: (filter: PackageManagerType | 'all') => void;
    setSearchQuery: (query: string) => void;

    // 加载状态
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;

    // 错误信息
    error: string | null;
    setError: (error: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
    packages: [],
    setPackages: (packages) => set({ packages }),
    updatePackageSize: (packageName, size) =>
        set((state) => ({
            packages: state.packages.map((pkg) =>
                pkg.name === packageName ? { ...pkg, size } : pkg
            ),
        })),

    selectedPackages: new Set(),
    togglePackage: (packageName) =>
        set((state) => {
            const newSet = new Set(state.selectedPackages);
            if (newSet.has(packageName)) {
                newSet.delete(packageName);
            } else {
                newSet.add(packageName);
            }
            return { selectedPackages: newSet };
        }),
    clearSelection: () => set({ selectedPackages: new Set() }),

    currentView: 'list',
    setCurrentView: (view) => set({ currentView: view }),

    highlightedPackage: null,
    setHighlightedPackage: (pkg) => set({ highlightedPackage: pkg }),

    managerFilter: 'all',
    searchQuery: '',
    setManagerFilter: (filter) => set({ managerFilter: filter }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    isLoading: false,
    setIsLoading: (loading) => set({ isLoading: loading }),

    error: null,
    setError: (error) => set({ error }),
}));
