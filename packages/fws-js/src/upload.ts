export type FileUploadState = 'queue' | 'uploading' | 'success' | 'error';

export interface FileUpload {
    file: File;
    progress: number;
    state: FileUploadState;
    cancelController?: AbortController;
}

export class Uploader {
    public files: FileUpload[] = [];

    addFile(file: File) {
        this.files.push({
            file,
            progress: 0,
            state: 'queue',
        });
    }

    clearFiles() {
        for (let i = 0; i < this.files.length; i++) {
            if (this.files[i].state === 'queue') {
                this.cancelUpload(i);
            }
        }
        this.files = [];
    }

    addFiles(files: FileList) {
        for (let i = 0; i < files.length; i++) {
            this.addFile(files[i]);
        }
    }

    startUpload(endpoint: string = '/Blob/Upload', callback: any = null) {
        let uploadCount = 0; 
    
        this.files.forEach((upload, index) => {
            if (upload.state === 'queue') {
                this.uploadFile(index, endpoint, () => {
                    uploadCount++; 
                    if (uploadCount === this.files.length) { 
                        if (callback) {
                            callback(); 
                        }
                    }
                });
            } else {
                uploadCount++;
                if (uploadCount === this.files.length && callback) {
                    callback();
                }
            }
        });
    }
    private uploadFile(index: number, endpoint: string, uploadCompleteCallback: () => void) {
        const fileUpload = this.files[index];
        const formData = new FormData();
        formData.append('file', fileUpload.file);
    
        const xhr = new XMLHttpRequest();
        const cancelController = new AbortController();
        fileUpload.cancelController = { abort: () => xhr.abort(), signal: cancelController.signal };
    
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100);
                fileUpload.progress = progress;
            }
        });
    
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                fileUpload.state = 'success';
            } else {
                fileUpload.state = 'error';
            }
            fileUpload.progress = 100;
            uploadCompleteCallback();
        });
    
        xhr.addEventListener('error', () => {
            fileUpload.state = 'error';
            fileUpload.progress = 100;
            uploadCompleteCallback();
        });
    
        fileUpload.state = 'uploading';
        xhr.open('POST', endpoint);
        xhr.send(formData);
    }
    

    cancelUpload(index: number) {
        const fileUpload = this.files[index];
        if (fileUpload.cancelController) {
            fileUpload.cancelController.abort();
            fileUpload.state = 'error';
        }
    }

    getFileUploads() {
        return this.files;
    }
}