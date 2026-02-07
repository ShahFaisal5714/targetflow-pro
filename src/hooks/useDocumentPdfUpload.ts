import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useDocumentPdfUpload() {
  const { user } = useAuth();

  const uploadPdfForSharing = useCallback(async (
    pdfBlob: Blob,
    documentNumber: string,
    documentType: string = 'Invoice'
  ): Promise<string | null> => {
    if (!user) return null;

    try {
      // Create a unique filename
      const timestamp = Date.now();
      const filename = `${user.id}/${documentNumber.replace(/[^a-zA-Z0-9-]/g, '_')}_${timestamp}.pdf`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('document-pdfs')
        .upload(filename, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('document-pdfs')
        .getPublicUrl(data.path);

      const originalUrl = publicUrlData.publicUrl;

      // Create short URL
      const { data: shortUrlData, error: shortUrlError } = await supabase.functions.invoke(
        'shorten-url',
        {
          body: {
            originalUrl,
            documentNumber,
            documentType,
          },
        }
      );

      if (shortUrlError || !shortUrlData?.success) {
        console.warn('Could not create short URL, using original:', shortUrlError);
        return originalUrl;
      }

      return shortUrlData.shortUrl;
    } catch (error) {
      console.error('Error uploading PDF:', error);
      return null;
    }
  }, [user]);

  return { uploadPdfForSharing };
}
