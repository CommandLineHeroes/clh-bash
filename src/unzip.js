var zlib = require('zlib');  
var fs = require('fs'); 

function decompress(inFilename, outFilename) { 
  var unzip = zlib.createUnzip();  
  var input = fs.createReadStream(inFilename);  
  var output = fs.createWriteStream(outFilename);  
  
  input.pipe(unzip).pipe(output); 
}

decompress('assets/models/CLH_Computer.mtl.gz', 'assets/models/CLH_Computer.mtl');
decompress('assets/models/CLH_Computer.obj.gz', 'assets/models/CLH_Computer.obj');
decompress('assets/models/CLH_ep2_computer_high_poly.mtl.gz', 'assets/models/CLH_ep2_computer_high_poly.mtl');
decompress('assets/models/CLH_ep2_computer_high_poly.obj.gz', 'assets/models/CLH_ep2_computer_high_poly.obj');
decompress('assets/models/CLH_ep2_cyc_wall.mtl.gz', 'assets/models/CLH_ep2_cyc_wall.mtl');
decompress('assets/models/CLH_ep2_cyc_wall.obj.gz', 'assets/models/CLH_ep2_cyc_wall.obj');
decompress('assets/models/CLH_Shuttle.mtl.gz', 'assets/models/CLH_Shuttle.mtl');
decompress('assets/models/CLH_Shuttle.obj.gz', 'assets/models/CLH_Shuttle.obj');