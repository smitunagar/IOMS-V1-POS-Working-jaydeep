import React from 'react';
import Link from 'next/link';
import { APP_REGISTRY, AppMetadata } from '@/server/lib/appRegistry';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { 
  Leaf, 
  Building2, 
  Truck, 
  ChefHat, 
  Package,
  BarChart3,
  ShoppingCart,
  Users,
  Star,
  ArrowRight,
  Zap
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<any>> = {
  '♻️': Leaf,
  '🏛️': Building2,
  '🚛': Truck,
  '👨‍🍳': ChefHat,
  '🏢': Package,
  '🏠': Users,
  'default': BarChart3
};

interface AppGridProps {
  className?: string;
  maxItems?: number;
  showAllLink?: boolean;
  filteredApps?: AppMetadata[];
}

export default function AppGrid({ className = '', maxItems, showAllLink = true, filteredApps }: AppGridProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { variant: 'default' as const, text: 'Active' },
      'beta': { variant: 'secondary' as const, text: 'Beta' },
      'coming-soon': { variant: 'outline' as const, text: 'Coming Soon' },
      'deprecated': { variant: 'destructive' as const, text: 'Deprecated' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return (
      <Badge variant={config.variant} className="text-xs">
        {config.text}
      </Badge>
    );
  };

  const getPricingBadge = (pricing: string) => {
    const pricingConfig = {
      'free': { color: 'text-green-700 bg-green-100', text: 'Free' },
      'freemium': { color: 'text-blue-700 bg-blue-100', text: 'Freemium' },
      'paid': { color: 'text-purple-700 bg-purple-100', text: 'Paid' },
      'enterprise': { color: 'text-orange-700 bg-orange-100', text: 'Enterprise' }
    };
    
    const config = pricingConfig[pricing as keyof typeof pricingConfig] || pricingConfig.freemium;
    return (
      <Badge className={`text-xs ${config.color}`}>
        {config.text}
      </Badge>
    );
  };

  const getAppIcon = (iconString: string) => {
    const IconComponent = iconMap[iconString] || iconMap.default;
    return <IconComponent className="h-6 w-6" />;
  };

  const sourceApps = filteredApps || APP_REGISTRY;
  const displayedApps = maxItems ? sourceApps.slice(0, maxItems) : sourceApps;
  const activeApps = displayedApps.filter(app => app.status === 'active' || app.status === 'beta');

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">IOMS Apps</h2>
          <p className="text-gray-600">Powerful modules to enhance your business operations</p>
        </div>
        {showAllLink && (
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            View All Apps <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeApps.map((app: AppMetadata) => (
          <Card key={app.id} className="hover:shadow-lg transition-shadow duration-300 border-2 hover:border-blue-200">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border">
                    {getAppIcon(app.icon)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{app.name}</CardTitle>
                    <p className="text-sm text-gray-600">{app.category}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {getStatusBadge(app.status)}
                  {getPricingBadge(app.pricing)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-gray-700 text-sm line-clamp-2">{app.description}</p>
              
              {/* Key Features */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2 text-sm">Key Features:</h4>
                <div className="space-y-1">
                  {app.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs text-gray-600">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                  {app.features.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{app.features.length - 3} more features
                    </div>
                  )}
                </div>
              </div>
              
              {/* Footer */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs text-gray-500">
                    v{app.version} • by {app.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-xs text-gray-600">4.8</span>
                  </div>
                </div>
                
                <Button 
                  asChild 
                  className={`w-full ${
                    app.status === 'coming-soon' || app.status === 'deprecated' 
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed hover:bg-gray-100' 
                      : ''
                  }`}
                  disabled={app.status === 'coming-soon' || app.status === 'deprecated'}
                >
                  <Link href={app.route} className="flex items-center justify-center gap-2">
                    {app.status === 'coming-soon' ? (
                      <>
                        <span>Coming Soon</span>
                      </>
                    ) : app.status === 'deprecated' ? (
                      <>
                        <span>Deprecated</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        <span>Launch App</span>
                      </>
                    )}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {activeApps.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No apps available</h3>
          <p className="text-gray-600">Check back later for new applications</p>
        </div>
      )}
    </div>
  );
}
