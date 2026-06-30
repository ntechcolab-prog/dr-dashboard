// Back-compat shim: the dashboard's persisted state now lives in Neon, shared
// per company. `useLocalStorage` keeps its old name/signature but is backed by
// `useCompanyState`, so every existing call site works unchanged.
export { useCompanyState as useLocalStorage } from '@/src/client/CompanyState'
