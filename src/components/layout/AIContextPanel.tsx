import { Bot, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export const AIContextPanel = () => {
    return (
        <aside className="hidden lg:flex flex-col w-80 border-l border-white/5 bg-background/50 h-screen sticky top-0 backdrop-blur-sm">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-brand-lime">
                    <Bot className="h-5 w-5" />
                    <span className="font-heading font-bold tracking-wide">AI Assistant</span>
                </div>
                <div className="flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-lime opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-lime"></span>
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">Active</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Context Card 1 */}
                <Card className="bg-white/5 border-brand-lime/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-brand-lime">
                            <Sparkles className="h-4 w-4" />
                            Sugerencia
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                        Parece que estás buscando eventos de Jazz. Hay 3 nuevos locales en Gràcia buscando saxofonistas para este viernes.
                        <Button size="sm" variant="ghost" className="mt-2 w-full text-brand-cyan hover:text-brand-cyan hover:bg-brand-cyan/10">
                            Ver Oportunidades <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Simulated Chat Bubble */}
                <div className="flex gap-2">
                    <div className="h-8 w-8 rounded-full bg-brand-petrol flex items-center justify-center shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white/5 rounded-2xl rounded-tl-none p-3 text-xs text-gray-300 border border-white/5">
                        ¿Necesitas ayuda para configurar tu perfil de músico? Puedo redactar tu biografía automáticamente.
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-white/5">
                <Button className="w-full bg-brand-lime text-black hover:bg-brand-lime/90 font-bold shadow-[0_0_15px_rgba(130,255,31,0.3)]">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Pedir Ayuda
                </Button>
            </div>
        </aside>
    );
};
