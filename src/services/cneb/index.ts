import { db } from '../../store/db';
import { NivelEducativo, CNEBAreaData, CNEBCompetencia, CNEBDesempeno } from '../../types/schemas';

/**
 * Servicio para gestionar los datos del Currículo Nacional (CNEB).
 * Implementa caché en IndexedDB y carga perezosa de áreas.
 */
export class CNEBService {
    private static instance: CNEBService;
    private memoryCache: Map<string, CNEBAreaData> = new Map();
    private indexVersion = import.meta.env.VITE_CNEB_INDEX_VERSION || '1.0.0';

    private constructor() { }

    public static getInstance(): CNEBService {
        if (!CNEBService.instance) {
            CNEBService.instance = new CNEBService();
        }
        return CNEBService.instance;
    }

    /**
     * Carga el índice CNEB y verifica la versión.
     * Si la versión es distinta, limpia la tabla cneb_index.
     */
    public async loadCNEBIndex(): Promise<void> {
        const storedVersion = localStorage.getItem('planx_cneb_version');
        if (storedVersion !== this.indexVersion) {
            console.log(`Actualizando índice CNEB de ${storedVersion} a ${this.indexVersion}`);
            await db.cneb_index.clear();
            localStorage.setItem('planx_cneb_version', this.indexVersion);
        }
    }

    /**
     * Carga los datos de un área específica. 
     * Prioridad: Memoria -> IndexedDB -> Import Dinámico.
     */
    public async getAreaData(area: string, nivel: NivelEducativo): Promise<CNEBAreaData | null> {
        const fileName = this.normalizeFileName(area);
        const nivelDir = nivel.toLowerCase();
        const cacheKey = `${nivelDir}/${fileName}`;

        // 1. Memoria
        if (this.memoryCache.has(cacheKey)) {
            return this.memoryCache.get(cacheKey)!;
        }

        // 2. IndexedDB
        const stored = await db.cneb_index.get(cacheKey);
        if (stored) {
            this.memoryCache.set(cacheKey, stored.data as unknown as CNEBAreaData);
            return stored.data as unknown as CNEBAreaData;
        }

        // 3. Import Dinámico (Lazy Load)
        try {
            const data = await import(`./data/${nivelDir}/${fileName}.json`);
            const areaData = data.default || data;

            // Guardar en IndexedDB para la próxima
            await db.cneb_index.put({
                id: cacheKey,
                nivel,
                area,
                competenciaId: 'all', // Marcador para datos completos del área
                data: areaData
            });

            this.memoryCache.set(cacheKey, areaData);
            return areaData;
        } catch (error) {
            console.error(`Error cargando datos CNEB para ${nivel} - ${area}:`, error);
            return null;
        }
    }

    /**
     * Obtiene todas las competencias de un área y nivel.
     */
    public async getCompetenciasByAreaNivel(area: string, nivel: NivelEducativo): Promise<CNEBCompetencia[]> {
        const data = await this.getAreaData(area, nivel);
        return data ? data.competencias : [];
    }

    /**
     * Obtiene las capacidades de una competencia específica.
     */
    public async getCapacidadesByCompetencia(area: string, nivel: NivelEducativo, competenciaNombre: string): Promise<string[]> {
        const competencias = await this.getCompetenciasByAreaNivel(area, nivel);
        const comp = competencias.find(c => c.nombre === competenciaNombre);
        return comp ? comp.capacidades : [];
    }

    /**
     * Obtiene los desempeños filtrados por capacidad y grado.
     */
    public async getDesempenosByCapacidadGrado(
        area: string,
        nivel: NivelEducativo,
        competenciaNombre: string,
        capacidadNombre: string,
        grado: string
    ): Promise<CNEBDesempeno[]> {
        const competencias = await this.getCompetenciasByAreaNivel(area, nivel);
        const comp = competencias.find(c => c.nombre === competenciaNombre);

        if (!comp) return [];

        return comp.desempenos.filter(d =>
            d.capacidad === capacidadNombre &&
            d.grado.toLowerCase() === grado.toLowerCase()
        );
    }

    /**
     * Obtiene el estándar para un ciclo y competencia.
     */
    public async getEstandar(
        area: string,
        nivel: NivelEducativo,
        competenciaNombre: string,
        ciclo: string
    ): Promise<string> {
        const competencias = await this.getCompetenciasByAreaNivel(area, nivel);
        const comp = competencias.find(c => c.nombre === competenciaNombre);
        return comp?.estandares?.[ciclo] || '';
    }

    /**
     * Normaliza el nombre del archivo basado en el nombre del área.
     */
    private normalizeFileName(area: string): string {
        const base = area
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // Quitar tildes
            .replace(/\s+/g, '-')           // Espacios a guiones
            .replace(/[^a-z0-9-]/g, '');    // Limpiar caracteres especiales

        // Mapeos específicos para consistencia con los nombres de archivos JSON
        const mappings: Record<string, string> = {
            'comunicacion': 'comunicacion',
            'matematica': 'matematica',
            'desarrollo-personal-ciudadania-y-civica': 'dpcc',
            'desarrollo-personal-ciudadano-y-civica': 'dpcc',
            'dpcc': 'dpcc',
            'personal-social': 'personal-social',
            'ingles-como-lengua-extranjera': 'ingles',
            'ingles': 'ingles',
            'ciencia-y-tecnologia': 'ciencia-tecnologia',
            'ciencia-tecnologia': 'ciencia-tecnologia',
            'educacion-religiosa': 'educacion-religiosa',
            'educacion-fisica': 'educacion-fisica',
            'arte-y-cultura': 'arte-y-cultura',
            'ciencias-sociales': 'ciencias-sociales',
            'educacion-para-el-trabajo': 'educacion-para-el-trabajo',
            'ept': 'educacion-para-el-trabajo',
            'castellano-como-segunda-lengua': 'castellano-segunda-lengua',
            'competencias-transversales': 'competencias-transversales'
        };

        return mappings[base] || base;
    }
}

export const cnebService = CNEBService.getInstance();
