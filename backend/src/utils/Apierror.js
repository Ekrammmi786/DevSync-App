class ApiError extends Error{
    constructor(StatusCode,message,code="INTERNAL_ERROR"){
        super(message);
        this.StatusCode=StatusCode;
        this.code=code;
        this.success=false;

    }
}
export default ApiError;
