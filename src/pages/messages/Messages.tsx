import { Search, MoreVertical, Phone, Video } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';

export default function Messages() {
    return (
        <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-2rem)] flex bg-card border border-border rounded-2xl overflow-hidden shadow-sm mt-2 md:mt-0">
            {/* Sidebar List */}
            <div className="w-full md:w-80 border-r border-border flex flex-col">
                <div className="p-4 border-b border-border">
                    <h2 className="font-bold text-lg mb-4">Mensajes</h2>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar chats..." className="pl-9 bg-secondary border-none" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 hover:bg-muted/50 cursor-pointer flex gap-3 items-center border-b border-border/50 transition-colors">
                            <div className="h-10 w-10 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary">
                                {i === 1 ? 'SW' : i === 2 ? 'AS' : 'MD'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h4 className="font-semibold text-sm truncate">
                                        {i === 1 ? 'Sonic Wave Studio' : i === 2 ? 'Ana Singer' : 'Mark Drums'}
                                    </h4>
                                    <span className="text-[10px] text-muted-foreground">12:30</span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                    {i === 1 ? 'Confirmada la sesión del jueves.' : '¿Tienes disponible esa fecha?'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area (Hidden on mobile if listing is active, simplified here) */}
            <div className="hidden md:flex flex-1 flex-col bg-background/50">
                {/* Header */}
                <div className="p-4 border-b border-border flex justify-between items-center bg-card/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary text-xs">SW</div>
                        <div>
                            <h3 className="font-semibold text-sm">Sonic Wave Studio</h3>
                            <p className="text-[10px] text-emerald-500 flex items-center gap-1">
                                <span className="block h-1.5 w-1.5 rounded-full bg-emerald-500"></span> En línea
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Video className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
                    <div className="self-end max-w-[80%] bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-none text-sm shadow-md">
                        Hola, quería confirmar la reserva para este jueves.
                    </div>
                    <div className="self-start max-w-[80%] bg-muted p-3 rounded-2xl rounded-tl-none text-sm">
                        ¡Hola! Sí, todo confirmado. De 10:00 a 14:00.
                    </div>
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border bg-card/30">
                    <div className="flex gap-2">
                        <Input placeholder="Escribe un mensaje..." className="bg-secondary border-none" />
                        <Button size="icon" className="shrink-0">
                            <Search className="h-4 w-4 rotate-90" /> {/* Send Icon placeholder */}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
