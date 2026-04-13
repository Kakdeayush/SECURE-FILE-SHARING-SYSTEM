package com.secureshare.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.CipherOutputStream;
import javax.crypto.SecretKey;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.Base64;

@Slf4j
@Component
public class AesEncryptionUtil {

    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final int IV_SIZE = 16;

    @Value("${app.aes.secret-key}")
    private String aesSecretKey;

    private SecretKey getSecretKey() {
        // Pad or truncate key to exactly 16 bytes for AES-128
        byte[] keyBytes = new byte[16];
        byte[] rawKey = aesSecretKey.getBytes();
        System.arraycopy(rawKey, 0, keyBytes, 0, Math.min(rawKey.length, 16));
        return new SecretKeySpec(keyBytes, "AES");
    }

    /**
     * Encrypts a file and writes to the destination path.
     * Prepends the 16-byte IV to the beginning of the encrypted file.
     */
    public void encryptFile(Path sourcePath, Path destPath) throws Exception {
        SecretKey key = getSecretKey();
        byte[] iv = new byte[IV_SIZE];
        new SecureRandom().nextBytes(iv);
        IvParameterSpec ivSpec = new IvParameterSpec(iv);

        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.ENCRYPT_MODE, key, ivSpec);

        try (InputStream in = Files.newInputStream(sourcePath);
             OutputStream out = Files.newOutputStream(destPath)) {
            // Write IV first
            out.write(iv);
            // Encrypt and write data
            try (CipherOutputStream cos = new CipherOutputStream(out, cipher)) {
                byte[] buffer = new byte[8192];
                int bytesRead;
                while ((bytesRead = in.read(buffer)) != -1) {
                    cos.write(buffer, 0, bytesRead);
                }
            }
        }
        log.debug("File encrypted: {}", destPath);
    }

    /**
     * Decrypts a file and streams the decrypted content to the output stream.
     * Reads the 16-byte IV from the beginning of the encrypted file.
     */
    public void decryptFileToStream(Path encryptedFilePath, OutputStream outputStream) throws Exception {
        SecretKey key = getSecretKey();

        try (InputStream in = Files.newInputStream(encryptedFilePath)) {
            // Read IV from beginning of file
            byte[] iv = new byte[IV_SIZE];
            int bytesRead = in.read(iv);
            if (bytesRead != IV_SIZE) {
                throw new IllegalStateException("Invalid encrypted file: could not read IV");
            }

            IvParameterSpec ivSpec = new IvParameterSpec(iv);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key, ivSpec);

            try (CipherInputStream cis = new CipherInputStream(in, cipher)) {
                byte[] buffer = new byte[8192];
                int read;
                while ((read = cis.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, read);
                }
            }
        }
        log.debug("File decrypted: {}", encryptedFilePath);
    }

    /**
     * Returns a Base64-encoded representation of the AES key (for storage reference).
     */
    public String getEncodedKey() {
        return Base64.getEncoder().encodeToString(getSecretKey().getEncoded());
    }
}
