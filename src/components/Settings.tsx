
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Settings as SettingsIcon, Download, Upload, FileCode, Database, Save } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "sonner";
import databaseService from "@/services/database";
import { SqlFileManager } from "@/services/sqlFileManager";

interface SettingsProps {
  onSidebarToggle: (visible: boolean) => void;
}

export function Settings({ onSidebarToggle }: SettingsProps) {
  const { settings, updateSettings } = useSettings();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(settings);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = () => {
    updateSettings(formData);
    onSidebarToggle(formData.sidebarVisible);
    toast.success("Paramètres sauvegardés avec succès !");
    setOpen(false);
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleExportDatabase = async () => {
    setIsLoading(true);
    try {
      await databaseService.exportToFile();
      toast.success("Base de données exportée avec succès !");
    } catch (error) {
      toast.error("Erreur lors de l'export de la base de données");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportDatabase = async () => {
    setIsLoading(true);
    try {
      const success = await databaseService.importFromFile();
      if (success) {
        toast.success("Base de données importée avec succès !");
        // Recharger la page pour mettre à jour toutes les données
        window.location.reload();
      } else {
        toast.info("Import annulé");
      }
    } catch (error) {
      toast.error("Erreur lors de l'import de la base de données");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsLoading(true);
    try {
      await databaseService.createBackup();
      toast.success("Sauvegarde créée avec succès !");
    } catch (error) {
      toast.error("Erreur lors de la création de la sauvegarde");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCreateScript = async () => {
    setIsLoading(true);
    try {
      await databaseService.exportCreateScript();
      toast.success("Script de création exporté avec succès !");
    } catch (error) {
      toast.error("Erreur lors de l'export du script");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportDataSQL = async () => {
    setIsLoading(true);
    try {
      await SqlFileManager.getInstance().downloadSQLFile();
      toast.success("Fichier SQL téléchargé avec succès !");
    } catch (error) {
      toast.error("Erreur lors du téléchargement du fichier SQL");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <SettingsIcon className="h-4 w-4" />
          <span>Paramètres</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Paramètres de l'application</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations de l'école</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="schoolName">Nom de l'école</Label>
                <Input
                  id="schoolName"
                  value={formData.schoolName}
                  onChange={(e) => handleInputChange("schoolName", e.target.value)}
                  placeholder="Nom de l'école"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="schoolLocation">Lieu</Label>
                <Input
                  id="schoolLocation"
                  value={formData.schoolLocation}
                  onChange={(e) => handleInputChange("schoolLocation", e.target.value)}
                  placeholder="Adresse de l'école"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="schoolPhone">Numéro de téléphone</Label>
                <Input
                  id="schoolPhone"
                  value={formData.schoolPhone}
                  onChange={(e) => handleInputChange("schoolPhone", e.target.value)}
                  placeholder="Numéro de téléphone"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Apparence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Thème</Label>
                <Select 
                  value={formData.theme} 
                  onValueChange={(value: 'light' | 'dark' | 'system') => handleInputChange("theme", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le thème" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Clair</SelectItem>
                    <SelectItem value="dark">Sombre</SelectItem>
                    <SelectItem value="system">Système</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="sidebarVisible">Afficher la barre latérale</Label>
                <Switch
                  id="sidebarVisible"
                  checked={formData.sidebarVisible}
                  onCheckedChange={(checked) => handleInputChange("sidebarVisible", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                Gestion de la base de données
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={handleExportDatabase}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exporter BD (.db)
                </Button>
                
                <Button
                  onClick={handleImportDatabase}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Importer BD (.db)
                </Button>
                
                <Button
                  onClick={handleCreateBackup}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  Sauvegarde
                </Button>
                
                <Button
                  onClick={handleExportCreateScript}
                  disabled={isLoading}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <FileCode className="h-4 w-4" />
                  Script SQL de création
                </Button>
              </div>
              
              <Button
                onClick={handleExportDataSQL}
                disabled={isLoading}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Télécharger fichier SQL actuel
              </Button>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p><strong>Exporter BD :</strong> Sauvegarde complète (.db) pour partage</p>
                <p><strong>Importer BD :</strong> Remplace la base actuelle</p>
                <p><strong>Script SQL :</strong> Fichier pour créer les tables</p>
                <p><strong>Données SQL :</strong> Fichier avec toutes les données</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave}>
              Sauvegarder
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
