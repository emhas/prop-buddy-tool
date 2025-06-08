type AncestryResult = {
    ancestry: string;
    count: number;
  };
  
  export async function getTopAncestries(salCode: string): Promise<AncestryResult[]> {
    const endpoint = `https://data.api.abs.gov.au/data/ABS,ANCP,1.0.0/ANCESTRY.ALL.${salCode}?startPeriod=2021&format=jsondata`;
  
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`HTTP error: ${res.status}`);
      const data = await res.json();
  
      const structure = data?.structure?.dimensions?.observation;
      const ancestryDim = structure?.find((dim: any) => dim.id === 'ANCESTRY');
      const ancestryMap = ancestryDim?.values || [];
  
      const obs = data?.dataSets?.[0]?.observations;
      if (!obs) return [];
  
      const ancestryCounts: { [key: string]: number } = {};
      for (const key in obs) {
        const [index] = key.split(':');
        const count = obs[key][0];
        const ancestryName = ancestryMap[+index]?.name;
  
        if (ancestryName) {
          ancestryCounts[ancestryName] = (ancestryCounts[ancestryName] || 0) + count;
        }
      }
  
      return Object.entries(ancestryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([ancestry, count]) => ({ ancestry, count }));
    } catch (err) {
      console.error('Failed to fetch ancestry data:', err);
      return [];
    }
  }
  