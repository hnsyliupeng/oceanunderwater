import http.server, socketserver
socketserver.TCPServer.allow_reuse_address=True
class CORSHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin','*')
        self.send_header('Access-Control-Allow-Methods','GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers','*')
        super().end_headers()
PORT=8000
with socketserver.TCPServer(("0.0.0.0", PORT), CORSHandler) as httpd:
    print(f"Serving on 0.0.0.0:{PORT}")
    httpd.serve_forever()
