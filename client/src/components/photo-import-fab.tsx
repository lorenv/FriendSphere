import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, Users } from "lucide-react";
import { PhotoFaceImporter } from "@/components/photo-face-importer";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { type InsertFriend } from "@shared/schema";

export function PhotoImportFAB() {
  const [showPhotoImporter, setShowPhotoImporter] = useState(false);
  const { toast } = useToast();

  const handlePhotoImportContacts = async (contacts: Array<{
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    photo?: string;
    relationshipLevel: string;
  }>) => {
    let successCount = 0;
    let errorCount = 0;

    for (const contact of contacts) {
      try {
        const friendData: InsertFriend = {
          firstName: contact.firstName,
          lastName: contact.lastName,
          phone: contact.phone,
          email: contact.email,
          photo: contact.photo,
          relationshipLevel: contact.relationshipLevel,
          isNewFriend: true,
          hasPartner: false,
          hasKids: false,
          childrenNames: [],
        };

        await apiRequest("POST", "/api/friends", friendData);
        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Failed to add ${contact.firstName}:`, error);
      }
    }

    queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    
    if (successCount > 0) {
      toast({
        title: "Photo Import Complete",
        description: `Successfully added ${successCount} contact${successCount > 1 ? 's' : ''} from photo${errorCount > 0 ? `. ${errorCount} failed to add.` : ''}`,
      });
    } else if (errorCount > 0) {
      toast({
        title: "Import Failed",
        description: "Failed to add contacts from photo",
        variant: "destructive",
      });
    }

    setShowPhotoImporter(false);
  };

  return (
    <>
      <Button
        onClick={() => setShowPhotoImporter(true)}
        className="fixed bottom-20 right-4 h-14 w-14 rounded-full bg-primary-blue hover:bg-primary-blue/90 shadow-lg z-40"
        size="icon"
      >
        <div className="flex items-center">
          <Camera size={20} className="mr-1" />
          <Users size={16} />
        </div>
      </Button>

      <PhotoFaceImporter
        open={showPhotoImporter}
        onClose={() => setShowPhotoImporter(false)}
        onImportContacts={handlePhotoImportContacts}
      />
    </>
  );
}