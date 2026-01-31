// Supabase Configuration for Clock It
// Cloud storage and sync using Supabase

// Your Supabase Configuration
const SUPABASE_URL = 'https://odeywendatejizdiwvut.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_xU_82K-b5NDm5y32Ts1lGw_9BpWhYSA';

// Import Supabase client
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Storage bucket name
const PHOTO_BUCKET = 'clockit-photos';

class SupabaseSync {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
    }

    // Initialize and check connection
    async initialize() {
        try {
            // Check if user is already signed in
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                this.currentUser = session.user;
                this.isInitialized = true;
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Supabase initialization error:', error);
            return false;
        }
    }

    // Sign in with Google (using your OAuth client)
    async signInWithGoogle() {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}${window.location.pathname}`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    }
                }
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    }

    // Sign out
    async signOut() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            
            this.currentUser = null;
            this.isInitialized = false;
            return true;
        } catch (error) {
            console.error('Sign out error:', error);
            return false;
        }
    }

    // Upload photo to Supabase Storage
    async uploadPhoto(photoData) {
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }

        try {
            const photoId = Date.now().toString();
            const fileName = `${this.currentUser.id}/${photoId}.jpg`;

            // Convert base64 to blob
            const response = await fetch(photoData.data);
            const blob = await response.blob();

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from(PHOTO_BUCKET)
                .upload(fileName, blob, {
                    contentType: 'image/jpeg',
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase
                .storage
                .from(PHOTO_BUCKET)
                .getPublicUrl(fileName);

            // Save metadata to database
            const { data: dbData, error: dbError } = await supabase
                .from('photos')
                .insert({
                    user_id: this.currentUser.id,
                    photo_id: photoData.id,
                    storage_path: fileName,
                    public_url: urlData.publicUrl,
                    date: photoData.date,
                    timestamp: photoData.timestamp,
                    favorite: photoData.favorite || false,
                    uploaded: photoData.uploaded || false
                })
                .select()
                .single();

            if (dbError) throw dbError;

            return {
                ...photoData,
                cloudUrl: urlData.publicUrl,
                cloudPath: fileName,
                synced: true
            };
        } catch (error) {
            console.error('Upload error:', error);
            return null;
        }
    }

    // Download all photos for current user
    async downloadPhotos() {
        if (!this.currentUser) {
            throw new Error('User not authenticated');
        }

        try {
            const { data, error } = await supabase
                .from('photos')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('timestamp', { ascending: false });

            if (error) throw error;

            // Convert to app format
            return data.map(photo => ({
                id: photo.photo_id,
                data: photo.public_url, // Will load from URL
                date: photo.date,
                timestamp: photo.timestamp,
                favorite: photo.favorite,
                uploaded: photo.uploaded,
                cloudUrl: photo.public_url,
                cloudPath: photo.storage_path,
                synced: true
            }));
        } catch (error) {
            console.error('Download error:', error);
            return [];
        }
    }

    // Sync local photos to cloud
    async syncPhotos(localPhotos) {
        if (!this.currentUser) {
            console.log('User not authenticated, skipping sync');
            return;
        }

        const results = {
            uploaded: 0,
            failed: 0,
            skipped: 0
        };

        for (const photo of localPhotos) {
            // Skip if already synced
            if (photo.synced || photo.cloudUrl) {
                results.skipped++;
                continue;
            }

            const result = await this.uploadPhoto(photo);
            if (result) {
                results.uploaded++;
            } else {
                results.failed++;
            }
        }

        return results;
    }

    // Update photo metadata (e.g., favorite status)
    async updatePhoto(photoId, updates) {
        if (!this.currentUser) return false;

        try {
            const { data, error } = await supabase
                .from('photos')
                .update(updates)
                .eq('user_id', this.currentUser.id)
                .eq('photo_id', photoId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Update error:', error);
            return false;
        }
    }

    // Delete photo
    async deletePhoto(photoId, storagePath) {
        if (!this.currentUser) return false;

        try {
            // Delete from storage
            if (storagePath) {
                const { error: storageError } = await supabase
                    .storage
                    .from(PHOTO_BUCKET)
                    .remove([storagePath]);

                if (storageError) console.error('Storage delete error:', storageError);
            }

            // Delete from database
            const { error: dbError } = await supabase
                .from('photos')
                .delete()
                .eq('user_id', this.currentUser.id)
                .eq('photo_id', photoId);

            if (dbError) throw dbError;
            return true;
        } catch (error) {
            console.error('Delete error:', error);
            return false;
        }
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Export singleton instance
const supabaseSync = new SupabaseSync();

export default supabaseSync;
export { supabase };
