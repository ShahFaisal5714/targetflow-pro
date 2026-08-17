import { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { logError } from '@/lib/logger';

const normalizeCompanyName = (name: string) =>
  (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const isTargetSpecialtiesName = (name: string) => {
  const normalized = normalizeCompanyName(name);
  if (isTswpcName(name)) return false;
  return normalized.includes('target') || normalized.includes('specialties');
};

const isAlhadafName = (name: string) => {
  const normalized = normalizeCompanyName(name);
  return normalized.includes('alhadaf') || normalized.includes('hadaf') || normalized.includes('kabeer');
};

function isTswpcName(name: string) {
  const normalized = normalizeCompanyName(name);
  return normalized.includes('wpc');
}

export interface BankDetails {
  bankName: string;
  accountTitle: string;
  accountNumber: string;
  iban: string;
  swiftCode: string;
  currency?: string;
  branch?: string;
}

export interface CompanyTax {
  trn: string;
}

export interface CompanyOffice {
  label: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
}

export interface Company {
  id: string;
  name: string;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  bankDetails?: BankDetails;
  taxInfo?: CompanyTax;
  offices?: CompanyOffice[];
}

// Fixed company data for Target Specialties
export const TARGET_SPECIALTIES_DISPLAY: Company = {
  id: 'target-specialties',
  name: 'TARGET SPECIALTIES',
  logo_url: null,
  email: 'Info@targetspecialties.com',
  phone: '+971 50 958 7185',
  address: 'Building Rema plaza | Office no. 1 Aljurf 3 Ajman UAE',
  website: 'targetspecialties.com',
  is_default: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  bankDetails: {
    bankName: 'Abu Dhabi Commercial Bank PJSC',
    accountTitle: 'TARGET SPECIALTIES BUILDING MATERIAL TRADING SPS LLC',
    accountNumber: '14405625820001',
    iban: 'AE270030014405625820001',
    swiftCode: 'ADCBAEAA',
    currency: 'AED',
    branch: 'IBD-AJMAN BRANCH',
  },
  taxInfo: {
    trn: '104732260500003',
  },
};

// Fixed company data for Alhadaf Projects
export const ALHADAF_PROJECTS_DISPLAY: Company = {
  id: 'alhadaf-projects',
  name: 'AL HADAF AL KABEER METAL CONTRACTING',
  logo_url: null,
  email: null,
  phone: '+971 50 230 7822',
  address: '07, Saih Shuaib 2, Dubai Industrial City, Dubai, United Arab Emirates',
  website: null,
  is_default: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  bankDetails: {
    bankName: 'ADCB Bank',
    accountTitle: 'Al Hadaf Al Kabeer Metal Contracting',
    accountNumber: '11913588820001',
    iban: 'AE42 0030 0119 1358 8820 001',
    swiftCode: 'ADCBAEAA060',
    currency: 'AED',
  },
  taxInfo: {
    trn: '100529145300003',
  },
};

// Fixed company data for TS WPC Doors
export const TS_WPC_DOORS_DISPLAY: Company = {
  id: 'ts-wpc-doors',
  name: 'TS WPC DOORS',
  logo_url: null,
  email: 'info@tswpcdoors.com',
  phone: '+971 56 603 1585',
  address: 'Buliding Rema plaza | Office no. 1 Aljurf 3 Ajman UAE',
  website: 'tswpcdoors.com',
  is_default: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  bankDetails: TARGET_SPECIALTIES_DISPLAY.bankDetails,
  taxInfo: {
    trn: '104732260500003',
  },
  offices: [
    {
      label: 'UAE OFFICE',
      name: 'Target Specialties Building Material LLC WPC Doors UAE',
      address: 'Buliding Rema plaza | Office no. 1, Aljurf 3 Ajman UAE.',
      phone: '+971 566031585',
      email: 'info@tswpcdoors.com',
    },
    {
      label: 'UK OFFICE',
      name: 'Target Specialties WPC Doors PVT LTD UK',
      address: '55 Portland Street, AB11 6LN, Aberdeen, Scotland Uk',
      phone: '+44 7902 034289',
      email: 'David.Gosling@targetspecialties.com',
    },
  ],
};

// For backwards compatibility
export const TARGET_SPECIALTIES = TARGET_SPECIALTIES_DISPLAY;
export const ALHADAF_PROJECTS = ALHADAF_PROJECTS_DISPLAY;
export const TS_WPC_DOORS = TS_WPC_DOORS_DISPLAY;

export type CompanySlug = 'target-specialties' | 'alhadaf-projects' | 'ts-wpc-doors';

interface DbCompany {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  website: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// Helper to get active company ID (UUID or null)
export const getActiveCompanyId = (): string | null => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('activeCompanyId');
    if (stored === 'target-specialties' || !stored) {
      return null;
    }
    return stored;
  }
  return null;
};

// Helper to get display ID for UI purposes
export const getActiveDisplayId = (): string => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('activeCompanyId');
    if (stored && stored !== 'target-specialties') {
      return localStorage.getItem('activeCompanySlug') || 'alhadaf-projects';
    }
  }
  return 'target-specialties';
};

interface CompaniesContextType {
  companies: DbCompany[];
  activeCompanyId: string;
  activeDisplayId: CompanySlug;
  activeCompany: Company;
  targetCompany: Company;
  alhadafCompany: Company;
  tswpcCompany: Company;
  alhadafDbId: string | null;
  targetDbId: string | null;
  tswpcDbId: string | null;
  loading: boolean;
  setActiveCompany: (displayId: string) => Promise<boolean>;
  updateTargetCompany: (updates: Partial<Company>) => Promise<Company | null>;
  updateAlhadafCompany: (updates: Partial<Company>) => Promise<Company | null>;
  updateTswpcCompany: (updates: Partial<Company>) => Promise<Company | null>;
  getCompanyById: (id?: string | null) => Company;
  getSlugForId: (id?: string | null) => CompanySlug;
  refetchCompanies: () => Promise<void>;
}

const CompaniesContext = createContext<CompaniesContextType | undefined>(undefined);

export function CompaniesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<DbCompany[]>([]);
  const [alhadafDetails, setAlhadafDetails] = useState<Partial<Company>>({});
  const [alhadafDbId, setAlhadafDbId] = useState<string | null>(null);
  const [targetDbId, setTargetDbId] = useState<string | null>(null);
  const [targetDetails, setTargetDetails] = useState<Partial<Company>>({});
  const [tswpcDbId, setTswpcDbId] = useState<string | null>(null);
  const [tswpcDetails, setTswpcDetails] = useState<Partial<Company>>({});
  const [activeCompanyId, setActiveCompanyIdState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('activeCompanyId') || 'target-specialties';
    }
    return 'target-specialties';
  });
  const [activeSlug, setActiveSlug] = useState<CompanySlug>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('activeCompanyId');
      if (!stored || stored === 'target-specialties') return 'target-specialties';
      return (localStorage.getItem('activeCompanySlug') as CompanySlug) || 'alhadaf-projects';
    }
    return 'target-specialties';
  });
  const [loading, setLoading] = useState(true);

  const persistActive = useCallback((id: string, slug: CompanySlug) => {
    setActiveCompanyIdState(id);
    setActiveSlug(slug);
    localStorage.setItem('activeCompanyId', id);
    localStorage.setItem('activeCompanySlug', slug);
  }, []);

  const fetchCompanies = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: allCompanies, error: allError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (allError) throw allError;

      setCompanies(allCompanies || []);

      const pickBest = (list: DbCompany[]) => {
        const score = (c: DbCompany) => {
          const hasDetails = Boolean(c.email || c.phone || c.address || c.website);
          return (c.is_default ? 10 : 0) + (hasDetails ? 5 : 0);
        };
        return [...list].sort((a, b) => score(b) - score(a))[0];
      };

      const pickDetails = (c: DbCompany) => ({
        email: c.email,
        phone: c.phone,
        address: c.address,
        website: c.website,
      });

      const targetCandidates = (allCompanies || []).filter((c) => isTargetSpecialtiesName(c.name));
      const alhadafCandidates = (allCompanies || []).filter((c) => isAlhadafName(c.name));
      const tswpcCandidates = (allCompanies || []).filter((c) => isTswpcName(c.name));

      const target = targetCandidates.length ? pickBest(targetCandidates) : undefined;
      if (target) {
        setTargetDbId(target.id);
        setTargetDetails(pickDetails(target));
      }

      const alhadaf = alhadafCandidates.length ? pickBest(alhadafCandidates) : undefined;
      if (alhadaf) {
        setAlhadafDbId(alhadaf.id);
        setAlhadafDetails(pickDetails(alhadaf));
      }

      const tswpc = tswpcCandidates.length ? pickBest(tswpcCandidates) : undefined;
      if (tswpc) {
        setTswpcDbId(tswpc.id);
        setTswpcDetails(pickDetails(tswpc));
      }

      const defaultCompany = allCompanies?.find((c) => c.is_default);
      if (defaultCompany && defaultCompany.id !== target?.id) {
        const slug: CompanySlug = isTswpcName(defaultCompany.name)
          ? 'ts-wpc-doors'
          : isAlhadafName(defaultCompany.name)
            ? 'alhadaf-projects'
            : 'target-specialties';
        if (slug === 'target-specialties') {
          persistActive('target-specialties', 'target-specialties');
        } else {
          persistActive(defaultCompany.id, slug);
        }
      } else {
        persistActive('target-specialties', 'target-specialties');
      }
    } catch (error) {
      logError('CompaniesContext.fetchCompanies', error);
    } finally {
      setLoading(false);
    }
  }, [user, persistActive]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const updateCompanyByName = useCallback(
    async (
      name: string,
      updates: Partial<Company>,
      applyResult: (row: DbCompany) => void,
      successMessage: string,
    ): Promise<Company | null> => {
      if (!user) return null;

      try {
        const payload = {
          email: updates.email ?? null,
          phone: updates.phone ?? null,
          address: updates.address ?? null,
          website: updates.website ?? null,
        };

        const { data: updatedRows, error: updateError } = await supabase
          .from('companies')
          .update(payload)
          .eq('user_id', user.id)
          .eq('name', name)
          .select();

        if (updateError) throw updateError;

        let row = (updatedRows?.[0] as unknown as DbCompany) || null;

        if (!row) {
          const { data: created, error: insertError } = await supabase
            .from('companies')
            .insert({
              user_id: user.id,
              name,
              ...payload,
              is_default: false,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          row = created as unknown as DbCompany;
        }

        applyResult(row);

        toast({ title: 'Success', description: successMessage });

        return row as unknown as Company;
      } catch (error) {
        logError('CompaniesContext.updateCompany', error);
        toast({
          title: 'Error',
          description: 'Failed to update company',
          variant: 'destructive',
        });
        return null;
      }
    },
    [user],
  );

  const updateTargetCompany = useCallback(
    (updates: Partial<Company>) =>
      updateCompanyByName(
        TARGET_SPECIALTIES_DISPLAY.name,
        updates,
        (row) => {
          setTargetDbId(row.id);
          setTargetDetails({ email: row.email, phone: row.phone, address: row.address, website: row.website });
        },
        'Target Specialties details updated',
      ),
    [updateCompanyByName],
  );

  const updateAlhadafCompany = useCallback(
    (updates: Partial<Company>) =>
      updateCompanyByName(
        ALHADAF_PROJECTS_DISPLAY.name,
        updates,
        (row) => {
          setAlhadafDbId(row.id);
          setAlhadafDetails({ email: row.email, phone: row.phone, address: row.address, website: row.website });
        },
        'Alhadaf Projects details updated',
      ),
    [updateCompanyByName],
  );

  const updateTswpcCompany = useCallback(
    (updates: Partial<Company>) =>
      updateCompanyByName(
        TS_WPC_DOORS_DISPLAY.name,
        updates,
        (row) => {
          setTswpcDbId(row.id);
          setTswpcDetails({ email: row.email, phone: row.phone, address: row.address, website: row.website });
        },
        'TS WPC Doors details updated',
      ),
    [updateCompanyByName],
  );

  const setActiveCompanyHandler = useCallback(
    async (displayId: string): Promise<boolean> => {
      if (!user) return false;

      const slug = (displayId as CompanySlug) || 'target-specialties';

      try {
        await supabase.from('companies').update({ is_default: false }).eq('user_id', user.id);

        if (slug === 'alhadaf-projects' || slug === 'ts-wpc-doors') {
          const isAlhadaf = slug === 'alhadaf-projects';
          const fixedName = isAlhadaf ? ALHADAF_PROJECTS_DISPLAY.name : TS_WPC_DOORS_DISPLAY.name;
          let companyIdToActivate = isAlhadaf ? alhadafDbId : tswpcDbId;

          if (!companyIdToActivate) {
            const { data: existing, error: findError } = await supabase
              .from('companies')
              .select('id')
              .eq('user_id', user.id)
              .eq('name', fixedName)
              .limit(1);

            if (findError) throw findError;
            companyIdToActivate = existing?.[0]?.id ?? null;
          }

          if (!companyIdToActivate) {
            const { data: newCompany, error } = await supabase
              .from('companies')
              .insert({
                user_id: user.id,
                name: fixedName,
                is_default: true,
              })
              .select()
              .single();

            if (error) throw error;
            companyIdToActivate = newCompany.id;
          } else {
            await supabase.from('companies').update({ is_default: true }).eq('id', companyIdToActivate);
          }

          if (isAlhadaf) {
            setAlhadafDbId(companyIdToActivate);
          } else {
            setTswpcDbId(companyIdToActivate);
          }
          persistActive(companyIdToActivate, slug);
        } else {
          persistActive('target-specialties', 'target-specialties');
        }

        const label =
          slug === 'target-specialties'
            ? 'Target Specialties'
            : slug === 'alhadaf-projects'
              ? 'Alhadaf Projects'
              : 'TS WPC Doors';

        toast({ title: 'Success', description: `${label} is now active` });

        return true;
      } catch (error) {
        logError('CompaniesContext.setActiveCompany', error);
        toast({
          title: 'Error',
          description: 'Failed to set active company',
          variant: 'destructive',
        });
        return false;
      }
    },
    [user, alhadafDbId, tswpcDbId, persistActive],
  );

  const targetWithDetails = useMemo<Company>(() => {
    return {
      ...TARGET_SPECIALTIES_DISPLAY,
      id: targetDbId || 'target-specialties',
      ...targetDetails,
    };
  }, [targetDbId, targetDetails]);

  const alhadafWithDetails = useMemo<Company>(() => {
    return {
      ...ALHADAF_PROJECTS_DISPLAY,
      id: alhadafDbId || 'alhadaf-projects',
      ...alhadafDetails,
    };
  }, [alhadafDbId, alhadafDetails]);

  const tswpcWithDetails = useMemo<Company>(() => {
    return {
      ...TS_WPC_DOORS_DISPLAY,
      id: tswpcDbId || 'ts-wpc-doors',
      ...tswpcDetails,
    };
  }, [tswpcDbId, tswpcDetails]);

  const getSlugForId = useCallback(
    (id?: string | null): CompanySlug => {
      if (!id || id === 'target-specialties') return 'target-specialties';
      if (id === 'alhadaf-projects' || id === 'ts-wpc-doors') return id;
      if (tswpcDbId && id === tswpcDbId) return 'ts-wpc-doors';
      if (alhadafDbId && id === alhadafDbId) return 'alhadaf-projects';
      if (targetDbId && id === targetDbId) return 'target-specialties';
      // Unknown UUID: fall back on the stored slug when it matches the active id
      if (id === activeCompanyId) return activeSlug;
      const match = companies.find((c) => c.id === id);
      if (match) {
        if (isTswpcName(match.name)) return 'ts-wpc-doors';
        if (isAlhadafName(match.name)) return 'alhadaf-projects';
        return 'target-specialties';
      }
      return 'alhadaf-projects';
    },
    [alhadafDbId, tswpcDbId, targetDbId, activeCompanyId, activeSlug, companies],
  );

  const getCompanyById = useCallback(
    (id?: string | null): Company => {
      const slug = getSlugForId(id);
      if (slug === 'ts-wpc-doors') return tswpcWithDetails;
      if (slug === 'alhadaf-projects') return alhadafWithDetails;
      return targetWithDetails;
    },
    [getSlugForId, tswpcWithDetails, alhadafWithDetails, targetWithDetails],
  );

  const activeCompany = useMemo<Company>(() => {
    const slug = getSlugForId(activeCompanyId);
    if (slug === 'ts-wpc-doors') return { ...tswpcWithDetails, id: activeCompanyId };
    if (slug === 'alhadaf-projects') return { ...alhadafWithDetails, id: activeCompanyId };
    return targetWithDetails;
  }, [activeCompanyId, getSlugForId, tswpcWithDetails, alhadafWithDetails, targetWithDetails]);

  const activeDisplayId = useMemo(() => getSlugForId(activeCompanyId), [getSlugForId, activeCompanyId]);

  return (
    <CompaniesContext.Provider
      value={{
        companies,
        activeCompanyId,
        activeDisplayId,
        activeCompany,
        targetCompany: targetWithDetails,
        alhadafCompany: alhadafWithDetails,
        tswpcCompany: tswpcWithDetails,
        alhadafDbId,
        targetDbId,
        tswpcDbId,
        loading,
        setActiveCompany: setActiveCompanyHandler,
        updateTargetCompany,
        updateAlhadafCompany,
        updateTswpcCompany,
        getCompanyById,
        getSlugForId,
        refetchCompanies: fetchCompanies,
      }}
    >
      {children}
    </CompaniesContext.Provider>
  );
}

export function useCompaniesContext() {
  const context = useContext(CompaniesContext);
  if (context === undefined) {
    throw new Error('useCompaniesContext must be used within a CompaniesProvider');
  }
  return context;
}
