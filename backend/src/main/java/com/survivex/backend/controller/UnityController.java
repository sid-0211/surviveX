package com.survivex.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
public class UnityController {

    private final Path unityRoot = Paths.get(System.getProperty("user.dir"), "SurviveX_WEBGL").normalize();

    @GetMapping("/unity")
    public RedirectView redirectUnityRoot() {
        return new RedirectView("/unity/");
    }

    @GetMapping("/unity/")
    public ResponseEntity<Resource> serveUnityIndex() {
        return serveRelativePath("index.html");
    }

    @GetMapping("/unity/**")
    public ResponseEntity<Resource> serveUnityAsset(HttpServletRequest request) {
        String requestUri = request.getRequestURI();
        String relativePath = requestUri.substring("/unity/".length());
        if (!StringUtils.hasText(relativePath)) {
            relativePath = "index.html";
        }
        return serveRelativePath(relativePath);
    }

    private ResponseEntity<Resource> serveRelativePath(String relativePath) {
        Path resolvedPath = unityRoot.resolve(relativePath).normalize();
        if (!resolvedPath.startsWith(unityRoot)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid Unity asset path");
        }

        Resource resource = new FileSystemResource(resolvedPath);
        if (!resource.exists() || !resource.isReadable()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unity asset not found");
        }

        HttpHeaders headers = new HttpHeaders();
        String filename = resource.getFilename() == null ? "" : resource.getFilename();

        if (filename.endsWith(".br")) {
            headers.add(HttpHeaders.CONTENT_ENCODING, "br");
        }

        if (filename.endsWith(".loader.js") || filename.endsWith(".framework.js.br")) {
            headers.setContentType(MediaType.parseMediaType("application/javascript"));
        } else if (filename.endsWith(".wasm.br")) {
            headers.setContentType(MediaType.parseMediaType("application/wasm"));
        } else if (filename.endsWith(".data.br")) {
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        } else if (filename.endsWith(".css")) {
            headers.setContentType(MediaType.parseMediaType("text/css"));
        } else if (filename.endsWith(".png")) {
            headers.setContentType(MediaType.IMAGE_PNG);
        } else if (filename.endsWith(".ico")) {
            headers.setContentType(MediaType.parseMediaType("image/x-icon"));
        } else {
            headers.setContentType(MediaType.TEXT_HTML);
        }

        headers.setContentDisposition(ContentDisposition.inline().filename(filename).build());
        return new ResponseEntity<>(resource, headers, HttpStatus.OK);
    }
}
