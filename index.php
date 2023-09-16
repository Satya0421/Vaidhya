<!DOCTYPE html>
<html lang="en">
<body>
    <?php include_once("html/header.html"); ?>
    
    <?php
        // Get the requested page from the URL (e.g., /about, /contact)
        $requested_page = $_SERVER['REQUEST_URI'];
        
        // Map the requested URL to the corresponding HTML file
        $page_mapping = [
            '/about' => 'html/about.html',
            '/contact' => 'html/contact.html',
        ];
        
        // Check if the requested page exists in the mapping
        if (array_key_exists($requested_page, $page_mapping)) {
            include_once($page_mapping[$requested_page]);
        } else {
            // Handle 404 - Page not found
            include_once("html/404.html");
        }
    ?>

    <?php include_once("html/footer.html"); ?>
</body>
</html>
